package coraythan.keyswap.decks

import com.fasterxml.jackson.databind.ObjectMapper
import com.querydsl.jpa.impl.JPAQueryFactory
import coraythan.keyswap.House
import coraythan.keyswap.auctions.DeckListingRepo
import coraythan.keyswap.cards.Card
import coraythan.keyswap.cards.CardIds
import coraythan.keyswap.cards.CardService
import coraythan.keyswap.cards.CardType
import coraythan.keyswap.config.BadRequestException
import coraythan.keyswap.config.Env
import coraythan.keyswap.config.SchedulingConfig
import coraythan.keyswap.decks.models.*
import coraythan.keyswap.expansions.activeExpansions
import coraythan.keyswap.scheduledException
import coraythan.keyswap.scheduledStart
import coraythan.keyswap.scheduledStop
import coraythan.keyswap.stats.StatsService
import coraythan.keyswap.synergy.DeckSynergyService
import coraythan.keyswap.thirdpartyservices.KeyforgeApi
import coraythan.keyswap.thirdpartyservices.keyforgeApiDeckPageSize
import coraythan.keyswap.userdeck.UserDeck
import coraythan.keyswap.userdeck.UserDeckRepo
import coraythan.keyswap.users.CurrentUserService
import coraythan.keyswap.users.KeyUser
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.hibernate.exception.ConstraintViolationException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.HttpClientErrorException
import java.time.ZonedDateTime
import java.util.*
import javax.persistence.EntityManager
import kotlin.math.absoluteValue
import kotlin.system.measureTimeMillis

private const val lockImportNewDecksFor = "PT2M"
private const val lockUpdateRatings = "PT10S"
private const val lockUpdateCleanUnregistered = "PT48H"

var deckImportingUpToDate = false

@Transactional
@Service
class DeckImporterService(
        private val keyforgeApi: KeyforgeApi,
        private val cardService: CardService,
        private val deckSearchService: DeckSearchService,
        private val deckRepo: DeckRepo,
        private val deckPageService: DeckPageService,
        private val currentUserService: CurrentUserService,
        private val userDeckRepo: UserDeckRepo,
        private val deckRatingProgressService: DeckRatingProgressService,
        private val statsService: StatsService,
        private val objectMapper: ObjectMapper,
        private val deckListingRepo: DeckListingRepo,
        @Value("\${env}")
        private val env: Env,
        val entityManager: EntityManager
) {
    private val log = LoggerFactory.getLogger(this::class.java)

    private val query = JPAQueryFactory(entityManager)

    @Transactional(propagation = Propagation.NEVER)
    @Scheduled(fixedDelayString = lockImportNewDecksFor, initialDelayString = SchedulingConfig.importNewDecks)
    @SchedulerLock(name = "importNewDecks", lockAtLeastFor = lockImportNewDecksFor, lockAtMostFor = lockImportNewDecksFor)
    fun importNewDecks() {
        log.info("$scheduledStart new deck import.")

        val deckCountBeforeImport = deckRepo.estimateRowCount()

        deckImportingUpToDate = false
        var decksAdded = 0
        var pagesRequested = 0
        val importDecksDuration = measureTimeMillis {
            var currentPage = deckPageService.findCurrentPage()

            val maxPageRequests = 100
            while (pagesRequested < maxPageRequests) {
                if (pagesRequested != 0) Thread.sleep(3000)
                log.info("Importing decks, making page request $currentPage")
                try {
                    val decks = keyforgeApi.findDecks(currentPage)
                    if (decks == null) {
                        deckImportingUpToDate = true
                        log.info("Got null decks from the api for page $currentPage decks per page $keyforgeApiDeckPageSize")
                        break
                    } else if (decks.data.any {
                                // Only import decks from these sets
                                !activeExpansions.map { expansion -> expansion.expansionNumber }.contains(it.expansion)
                            }) {

                        log.info("Stopping deck import. Unknown expansion number among ${decks.data.map { it.expansion }}")
                        break
                    } else {
                        val cards = cardService.importNewCards(decks.data)
                        val decksToSaveCount = decks.data.count()
                        decksAdded += saveDecks(decks.data, cards, currentPage)
                        currentPage++
                        pagesRequested++

                        if (decksToSaveCount < keyforgeApiDeckPageSize) {
                            deckImportingUpToDate = true
                            log.info("Stopped getting decks, decks added $decksToSaveCount < $keyforgeApiDeckPageSize")
                            break
                        }
                    }
                } catch (e: HttpClientErrorException.TooManyRequests) {
                    log.warn("KeyForge API says we made too many requests. Sad day.")
                    break
                }
            }
        }
        val deckCountNow = deckRepo.count()
        log.info("$scheduledStop Added $decksAdded decks. Total decks: $deckCountNow. Decks added by counts ${deckCountNow - deckCountBeforeImport} " +
                "Pages requested $pagesRequested It took ${importDecksDuration / 1000} seconds.")
        deckSearchService.countFilters(DeckFilters())
    }

    @Scheduled(fixedDelayString = lockUpdateCleanUnregistered, initialDelayString = SchedulingConfig.cleanUnregisteredDecks)
    @SchedulerLock(name = "lockUpdateCleanUnregistered", lockAtLeastFor = lockUpdateCleanUnregistered, lockAtMostFor = lockUpdateCleanUnregistered)
    fun cleanOutUnregisteredDecks() {
        try {
            log.info("$scheduledStart clean out unregistered decks.")
            var unregDeckCount = 0
            var cleanedOut = 0
            val msToCleanUnreg = measureTimeMillis {
                val allUnregDecks = deckRepo.findAllByRegisteredFalse()
                unregDeckCount = allUnregDecks.size
                allUnregDecks.forEach { unreg ->
                    try {
                        val decksLike = deckRepo.findByNameIgnoreCase(unreg.name.trim().dropLastWhile { it == '\\' })
                                .filter { it.id != unreg.id }
                        when {
                            decksLike.isNotEmpty() -> {
                                log.info("Deleting unreg deck with name ${unreg.name} id ${unreg.keyforgeId} because it matches deck ${decksLike[0].keyforgeId}")
                                deleteUnreg(unreg)
                                cleanedOut++
                            }
                            deckSearchService.countFilters(DeckFilters(
                                    cards = cardService.cardsForDeck(unreg)
                                            .groupBy { it.cardTitle }
                                            .map {
                                                DeckCardQuantity(listOf(it.key), it.value.size)
                                            }
                            )).count > 0
                            -> {
                                // Eventually use this:
                                // val identicalRegistered = deckRepo.findByRegisteredTrueAndCardNames(unreg.cardNames)

                                log.info("Deleting unreg deck with name ${unreg.name} id ${unreg.keyforgeId} because it has a duplicate")
                                deleteUnreg(unreg)
                                cleanedOut++
                            }
                            userDeckRepo.findByDeckIdAndOwnedByNotNull(unreg.id).isEmpty() -> {
                                log.info("Deleting unreg deck with name ${unreg.name} id ${unreg.keyforgeId} because it is unowned")
                                deleteUnreg(unreg)
                                cleanedOut++
                            }
                        }
                    } catch (e: Exception) {
                        log.warn("Exception trying to clean unreg deck: ${unreg.name} with id ${unreg.keyforgeId}", e)
                    }
                }
            }

            log.info("$scheduledStop clean out unregistered decks. Pre-existing total: $unregDeckCount cleaned out: $cleanedOut seconds taken: ${msToCleanUnreg / 1000}")
        } catch (e: Throwable) {
            log.error("$scheduledException Cleaning out unregistered decks")
        }
    }

    // Rev publishAercVersion to rerate decks
    @Scheduled(fixedDelayString = lockUpdateRatings, initialDelayString = SchedulingConfig.rateDecksDelay)
    fun rateDecks() {

        try {

            // If next page is null, we know we are done
            var nextDeckPage = deckRatingProgressService.nextPage() ?: return
            var quantFound = 0
            var quantRerated = 0

            log.info("$scheduledStart rate decks.")

            val maxToRate = DeckPageType.RATING.quantity * (if (env == Env.dev) 10 else 1)

            val millisTaken = measureTimeMillis {

                while (quantRerated < maxToRate && quantFound < 100000) {

                    // If next page is null, we know we are done
                    nextDeckPage = deckRatingProgressService.nextPage() ?: break

                    val deckResults = deckPageService.decksForPage(nextDeckPage, DeckPageType.RATING)
                    quantFound += deckResults.size

                    val deckQ = QDeck.deck
                    val mostRecentDeck = query.selectFrom(deckQ)
                            .orderBy(deckQ.id.desc())
                            .limit(1)
                            .fetch()
                            .first()

                    val idEndForPage = deckPageService.idEndForPage(nextDeckPage, DeckPageType.RATING)

                    val rated = deckResults.mapNotNull {
                        val rated = rateDeck(it)
                        if (rated == it) {
                            null
                        } else {
                            rated.copy(lastUpdate = ZonedDateTime.now())
                        }
                    }
                    quantRerated += rated.size
                    if (rated.isNotEmpty()) {
                        deckRepo.saveAll(rated)
                    }
                    deckRatingProgressService.revPage()

                    if (mostRecentDeck.id < idEndForPage) {
                        deckRatingProgressService.complete()
                        statsService.startNewDeckStats()
                        log.info("Done rating decks!")
                        break
                    }
                    log.info("Got next page, quant rerated $quantRerated found $quantFound max $maxToRate")
                }
            }

            log.info("$scheduledStop Took $millisTaken ms to rate decks. Page: $nextDeckPage Found: $quantFound Rerated: $quantRerated.")
        } catch (e: Throwable) {
            log.error("$scheduledException rating decks")
        }
    }

    // Non repeatable functions

//    var currentPage = 3
//    var cardsFound = 0
//
//    @Scheduled(fixedDelayString = "PT15S")
//    fun addCardsForExpansion() {
//        try {
//            val expansionId = 452
//            val cardsInExpansion = 515
//            cardsFound = cardIdentifierRepo.countByExpansion(Expansion.forExpansionNumber(expansionId)).toInt()
//
//            if (cardsFound < cardsInExpansion) {
//                log.info("Looking for more cards with page $currentPage, cards found $cardsFound out of $cardsInExpansion")
//
//                try {
//                    val decks = keyforgeApi.findDecks(currentPage, expansion = expansionId)
//
//                    decks?.data?.forEach {
//                        val deckId = it.id
//                        val preExistingDeck = deckRepo.findByKeyforgeId(deckId)
//                        if (preExistingDeck == null) {
//                            val deck = keyforgeApi.findDeck(deckId)
//                            if (deck != null) {
//                                val deckList = listOf(deck.data.copy(cards = deck.data._links?.cards))
//                                cardService.importNewCards(deckList)
//                            }
//                        }
//                    }
//
//                    log.info("Cards added for $expansionId count: $cardsFound out of $cardsInExpansion")
//                    currentPage++
//                } catch (exception: Exception) {
//                    if (exception.message == "429 Too Many Requests") {
//                        log.warn("Keyforge api hates me")
//                    } else {
//                        log.error("Uh oh, adding new cards didn't work due to ${exception.message}", exception)
//                    }
//                }
//            } else {
//                log.info("Done adding cards for expansion")
//            }
//        } catch (exception: Exception) {
//            log.error("argh", exception)
//        }
//    }

    fun importDeck(deckId: String): Long? {
        val preExistingDeck = deckRepo.findByKeyforgeId(deckId)
        if (preExistingDeck != null) {
            return preExistingDeck.id
        } else {
            val deck = keyforgeApi.findDeckToImport(deckId)
            if (deck != null) {
                val deckList = listOf(deck.data.copy(cards = deck.data._links?.cards))
                val cards = cardService.importNewCards(deckList)
                return try {
                    saveDecks(deckList, cards)
                    deckRepo.findByKeyforgeId(deckId)?.id
                } catch (e: RuntimeException) {
                    if (e::class.java == DataIntegrityViolationException::class.java || e::class.java == ConstraintViolationException::class.java) {
                        // We must have a pre-existing deck now
                        log.info("Encountered exception saving deck to import, but it was just the deck already being saved")
                        deckRepo.findByKeyforgeId(deckId)?.id
                    } else {
                        throw e
                    }
                }
            }
        }
        return null
    }

    fun addUnregisteredDeck(
            unregisteredDeck: SaveUnregisteredDeck,
            currentUser: KeyUser? = null
    ): String {

        val user = currentUser ?: currentUserService.loggedInUserOrUnauthorized()

        log.info("Checking dups of unregistered deck.")
        val dup = deckSearchService.findByNameIgnoreCase(unregisteredDeck.name.toLowerCase())
        if (dup.isNotEmpty()) {
            // This string is used in the front end, so don't change it!
            throw BadRequestException("Duplicate deck name ${unregisteredDeck.name}")
        }

        if (unregisteredDeck.name.contains('\\')) {
            throw BadRequestException("Unregistered deck names should not contain \\.")
        }

        val deckAndCards = makeBasicDeckFromUnregisteredDeck(unregisteredDeck)

        val savedDeck = saveDeck(deckAndCards.first, unregisteredDeck.cards.keys.toList(), deckAndCards.second)
        val userDeck = UserDeck(user, savedDeck, creator = true)
        userDeckRepo.save(userDeck)
        log.info("Added unregistered deck with name ${savedDeck.name} fake id ${savedDeck.keyforgeId}")
        return savedDeck.keyforgeId
    }

    private fun deleteUnreg(deck: Deck) {
        if (deck.registered) throw IllegalArgumentException("Can't delete registered deck.")
        deck.auctions.forEach { deckListingRepo.deleteById(it.id) }
        deckRepo.deleteById(deck.id)
    }

    private fun makeBasicDeckFromUnregisteredDeck(unregisteredDeck: SaveUnregisteredDeck): Pair<Deck, List<Card>> {
        val cards = unregisteredDeck.cards.flatMap { entry ->
            entry.value.map {
                val cards = cardService.findByExpansionCardNameHouse(unregisteredDeck.expansion.expansionNumber, it, entry.key)
                if (cards.isEmpty()) {
                    throw BadRequestException("There is no card with expansion ${unregisteredDeck.expansion.expansionNumber} name $it and house ${entry.key}")
                }
                cards[0]
            }
        }
        return Deck(
                keyforgeId = UUID.randomUUID().toString(),
                name = unregisteredDeck.name,
                expansion = unregisteredDeck.expansion.expansionNumber,
                registered = false
        ) to cards
    }

    /**
     * Only set current page if this is auto importing new decks
     */
    @Transactional(propagation = Propagation.REQUIRED)
    fun saveDecks(deck: List<KeyforgeDeck>, cardsForDecks: List<Card>, currentPage: Int? = null): Int {
        var savedCount = 0
        val cardsById: Map<String, Card> = cardsForDecks.associateBy { it.id }
        deck
                .forEach { keyforgeDeck ->
                    if (deckRepo.findByKeyforgeId(keyforgeDeck.id) == null) {
                        val cardsList = keyforgeDeck.cards?.map { cardsById.getValue(it) } ?: listOf()
                        val houses = keyforgeDeck._links?.houses?.mapNotNull { House.fromMasterVaultValue(it) }
                                ?: throw java.lang.IllegalStateException("Deck didn't have houses.")
                        check(houses.size == 3) { "Deck ${keyforgeDeck.id} doesn't have three houses!" }
                        val deckToSave = keyforgeDeck.toDeck()

                        try {
                            saveDeck(deckToSave, houses, cardsList)
                            savedCount++
                        } catch (e: DataIntegrityViolationException) {
                            if (e.message?.contains("deck_keyforge_id_uk") == true) {
                                log.info("Ignoring unique key exception adding deck with id ${keyforgeDeck.id}.")
                            } else {
                                throw e
                            }
                        }
                    } else {
                        log.debug("Ignoring deck that already existed with id ${keyforgeDeck.id}")
                    }
                }
        if (currentPage != null && deck.count() >= keyforgeApiDeckPageSize) {
            val nextPage = currentPage + 1
            log.info("Updating next deck page to $nextPage")
            deckPageService.setCurrentPage(nextPage)
        }
        return savedCount
    }

    fun viewTheoreticalDeck(deck: SaveUnregisteredDeck): Deck {
        val deckAndCards = makeBasicDeckFromUnregisteredDeck(deck)
        return validateAndRateDeck(deckAndCards.first, deck.cards.keys.toList(), deckAndCards.second)
    }

    private fun saveDeck(deck: Deck, houses: List<House>, cardsList: List<Card>): Deck {
        val ratedDeck = validateAndRateDeck(deck, houses, cardsList)
        return deckRepo.save(ratedDeck)
    }

    private fun validateAndRateDeck(deck: Deck, houses: List<House>, cardsList: List<Card>): Deck {
        check(houses.size == 3) { "Deck doesn't have 3 houses! $deck" }
        check(cardsList.size == 36) { "Can't have a deck without 36 cards deck: $deck" }

        val saveable = deck
                .withCards(cardsList)
                .copy(
                        houseNamesString = houses.sorted().joinToString("|"),
                        cardIds = objectMapper.writeValueAsString(CardIds.fromCards(cardsList))
                )

        val ratedDeck = rateDeck(saveable)

        check(!ratedDeck.cardIds.isBlank()) { "Can't save a deck without its card ids: $deck" }

        return ratedDeck
    }

    private fun rateDeck(deck: Deck): Deck {
        val cards = cardService.cardsForDeck(deck)
        val deckSynergyInfo = DeckSynergyService.fromDeckWithCards(deck, cards)

        return deck.copy(

                creatureCount = cards.filter { it.cardType == CardType.Creature }.size,
                actionCount = cards.filter { it.cardType == CardType.Action }.size,
                artifactCount = cards.filter { it.cardType == CardType.Artifact }.size,
                upgradeCount = cards.filter { it.cardType == CardType.Upgrade }.size,

                amberControl = deckSynergyInfo.amberControl,
                expectedAmber = deckSynergyInfo.expectedAmber,
                artifactControl = deckSynergyInfo.artifactControl,
                creatureControl = deckSynergyInfo.creatureControl,
                efficiency = deckSynergyInfo.efficiency,
                effectivePower = deckSynergyInfo.effectivePower,
                disruption = deckSynergyInfo.disruption,
                amberProtection = deckSynergyInfo.amberProtection,
                houseCheating = deckSynergyInfo.houseCheating,
                other = deckSynergyInfo.other,
                aercScore = deckSynergyInfo.rawAerc.toDouble(),
                sasRating = deckSynergyInfo.sasRating,
                previousSasRating = if (deckSynergyInfo.sasRating != deck.sasRating) deck.sasRating else deck.previousSasRating,
                synergyRating = deckSynergyInfo.synergyRating,
                antisynergyRating = deckSynergyInfo.antisynergyRating.absoluteValue
        )
    }
}
