package coraythan.keyswap.userdeck

import com.querydsl.core.BooleanBuilder
import coraythan.keyswap.auctions.AuctionRepo
import coraythan.keyswap.auctions.AuctionStatus
import coraythan.keyswap.config.SchedulingConfig
import coraythan.keyswap.decks.DeckRepo
import coraythan.keyswap.decks.models.Deck
import coraythan.keyswap.decks.salenotifications.ForSaleNotificationsService
import coraythan.keyswap.now
import coraythan.keyswap.scheduledStart
import coraythan.keyswap.scheduledStop
import coraythan.keyswap.users.CurrentUserService
import coraythan.keyswap.users.KeyUser
import coraythan.keyswap.users.KeyUserRepo
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional
@Service
class UserDeckService(
        private val currentUserService: CurrentUserService,
        private val userRepo: KeyUserRepo,
        private val deckRepo: DeckRepo,
        private val userDeckRepo: UserDeckRepo,
        private val forSaleNotificationsService: ForSaleNotificationsService,
        private val auctionRepo: AuctionRepo
) {

    private val log = LoggerFactory.getLogger(this::class.java)

    @Scheduled(fixedDelayString = "PT6H", initialDelayString = SchedulingConfig.unexpiredDecksInitialDelay)
    fun unlistExpiredDecks() {
        log.info("$scheduledStart unlisting expired decks.")
        val toUnlist = userDeckRepo.findAll(
                QUserDeck.userDeck.expiresAt.before(now())
        )
        log.info("Unlisting ${toUnlist.toList().size} decks.")
        toUnlist.forEach {
            unlistUserDeck(it)
            log.info("Unlisted ${it.id}")
        }

        // Something is causing decks without for sale or trade, but with country + currency symbol
        val removeBadValues = userDeckRepo
                .findAll(BooleanBuilder()
                        .and(QUserDeck.userDeck.forSale.isFalse)
                        .and(QUserDeck.userDeck.forTrade.isFalse)
                        .andAnyOf(QUserDeck.userDeck.forSaleInCountry.isNotNull, QUserDeck.userDeck.askingPrice.isNotNull)
                ).toList()
        val safeBadValues = removeBadValues.filter { !it.forSale && !it.forTrade }
        log.info("Removing ${safeBadValues.map { it.id }} decks that had the country still when they shouldn't have.")
        if (removeBadValues.size != safeBadValues.size) log.warn("Removing bad values and we found ones we didn't want.")
        userDeckRepo.saveAll(safeBadValues.map { it.copy(forSaleInCountry = null, askingPrice = null) })

        log.info("$scheduledStop unlisting expired decks.")
    }

    // Don't want this running regularly
    @Scheduled(fixedDelayString = "PT144H")
    fun correctCounts() {
        log.info("$scheduledStart correcting counts.")
        try {
            userDeckRepo
                    .findAll(QUserDeck.userDeck.wishlist.isTrue)
                    .groupBy { it.deck.id }
                    .map { it.value.first().deck to it.value.size }
                    .forEach { if (it.first.wishlistCount != it.second) deckRepo.save(it.first.copy(wishlistCount = it.second)) }

            userDeckRepo
                    .findAll(QUserDeck.userDeck.funny.isTrue)
                    .groupBy { it.deck.id }
                    .map { it.value.first().deck to it.value.size }
                    .forEach { if (it.first.funnyCount != it.second) deckRepo.save(it.first.copy(funnyCount = it.second)) }
        } catch (exception: Exception) {
            log.error("Couldn't correct wishlist counts", exception)
        }
        log.info("$scheduledStop correcting counts.")
    }

    fun addToWishlist(deckId: Long, add: Boolean = true) {
        modOrCreateUserDeck(deckId, currentUserService.loggedInUserOrUnauthorized(), {
            it.copy(wishlistCount = it.wishlistCount + if (add) 1 else -1)
        }) {
            it.copy(wishlist = add)
        }
    }

    fun updateNotes(deckId: Long, notes: String) {
        modOrCreateUserDeck(deckId, currentUserService.loggedInUserOrUnauthorized(), null) {
            it.copy(notes = notes)
        }
    }

    fun markAsFunny(deckId: Long, mark: Boolean = true) {
        modOrCreateUserDeck(deckId, currentUserService.loggedInUserOrUnauthorized(), {
            it.copy(funnyCount = it.funnyCount + if (mark) 1 else -1)
        }) {
            it.copy(funny = mark)
        }
    }

    fun markAsOwned(deckId: Long, mark: Boolean = true) {
        val user = currentUserService.loggedInUserOrUnauthorized()
        modOrCreateUserDeck(deckId, user, null) {
            it.copy(ownedBy = if (mark) user.username else null)
        }
        if (!mark) {
            this.unlist(deckId)
        }
    }

    fun unmarkAsOwnedForSeller(deckId: Long, owner: KeyUser) {
        modOrCreateUserDeck(deckId, owner, null) {
            it.copy(ownedBy = null)
        }
    }

    fun updatePrices(prices: List<UpdatePrice>) {
        for (price in prices) {
            val currentUser = currentUserService.loggedInUserOrUnauthorized()
            val preexisting = userDeckRepo.findByDeckIdAndUserId(price.deckId, currentUser.id)
                    ?: throw IllegalArgumentException("There was no listing info for deck with id ${price.deckId}")
            userDeckRepo.save(preexisting.copy(askingPrice = price.askingPrice?.toDouble()))
        }
    }

    fun unlist(deckId: Long) {
        val currentUser = currentUserService.loggedInUserOrUnauthorized()
        unlistForUser(deckId, currentUser)
    }

    fun unlistForUser(deckId: Long, user: KeyUser) {
        unlistUserDeck(userDeckRepo.findByDeckIdAndUserId(deckId, user.id) ?: throw IllegalStateException("Couldn't find your deck listing."))
    }

    fun unlistUserDeck(userDeck: UserDeck) {
        val deckId = userDeck.deck.id
        userDeckRepo.save(userDeckWithoutListingInfo(userDeck))
        val userDeckQ = QUserDeck.userDeck
        val userDecksForSale = userDeckRepo.findAll(
                userDeckQ.forSale.isTrue
                        .and(userDeckQ.deck.id.eq(deckId))
                        .and(userDeckQ.id.ne(userDeck.id))
        )
        val userDecksForTrade = userDeckRepo.findAll(
                userDeckQ.forTrade.isTrue
                        .and(userDeckQ.deck.id.eq(deckId))
                        .and(userDeckQ.id.ne(userDeck.id))
        )
        val forSale = userDecksForSale.toList().isNotEmpty()
        val forTrade = userDecksForTrade.toList().isNotEmpty()
        deckRepo.save(userDeck.deck.copy(
                forSale = forSale,
                forTrade = forTrade,
                listedOn = if (forSale || forTrade) userDeck.deck.listedOn else null
        ))
    }

    private fun userDeckWithoutListingInfo(userDeck: UserDeck) = userDeck.copy(
            forSale = false,
            forTrade = false,
            forSaleInCountry = null,
            askingPrice = null,
            listingInfo = null,
            condition = null,
            dateListed = null,
            expiresAt = null,
            externalLink = null
    )


    private fun modOrCreateUserDeck(
            deckId: Long,
            currentUser: KeyUser,
            modDeck: ((deck: Deck) -> Deck)?,
            mod: (userDeck: UserDeck) -> UserDeck
    ) {
        val deck = deckRepo.getOne(deckId)
        val userDeck = currentUser.decks.filter { it.deck.id == deckId }.getOrElse(0) {
            UserDeck(currentUser, deck)
        }

        val toSave = currentUser.copy(decks = currentUser.decks.filter { it.deck.id != deckId }.plus(
                mod(userDeck)
        ))
        userRepo.save(toSave)

        if (modDeck != null) {
            deckRepo.save(modDeck(deck))
        }
    }

    fun findAllForUser(): List<UserDeckDto> {
        val currentUser = currentUserService.loggedInUserOrUnauthorized()
        val auctions = auctionRepo.findAllBySellerIdAndStatus(currentUser.id, AuctionStatus.ACTIVE)
        val activeAuctionDeckIds = auctions.map { it.deck.id to it }.toMap()
        return userDeckRepo.findByUserId(currentUser.id).map {
            it.toDto(activeAuctionDeckIds.contains(it.deck.id), activeAuctionDeckIds[it.deck.id]?.bids?.isNotEmpty() ?: false)
        }
    }
}
