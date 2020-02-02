package coraythan.keyswap.users.search

import com.querydsl.core.BooleanBuilder
import com.querydsl.core.types.Predicate
import com.querydsl.core.types.Projections
import com.querydsl.jpa.impl.JPAQueryFactory
import coraythan.keyswap.config.SchedulingConfig
import coraythan.keyswap.scheduledStart
import coraythan.keyswap.scheduledStop
import coraythan.keyswap.tokenize
import coraythan.keyswap.users.KeyUser
import coraythan.keyswap.users.KeyUserRepo
import coraythan.keyswap.users.QKeyUser
import net.javacrumbs.shedlock.core.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import javax.persistence.EntityManager
import kotlin.system.measureTimeMillis

const val lockUpdateUserSearchStatsFor = "PT1M"

@Service
@Transactional
class UserSearchService(
        private val userRepo: KeyUserRepo,
        private val entityManager: EntityManager
) {

    private val log = LoggerFactory.getLogger(this::class.java)
    private val query = JPAQueryFactory(entityManager)

    var allSearchableUsers: List<UserSearchResult> = listOf()
    var lastUserSearchUpdate: Instant = Instant.now()

    @Scheduled(fixedDelayString = lockUpdateUserSearchStatsFor, initialDelayString = SchedulingConfig.updateUserStats)
    @SchedulerLock(name = "updateUserStats", lockAtLeastForString = lockUpdateUserSearchStatsFor, lockAtMostForString = lockUpdateUserSearchStatsFor)
    fun updateUserStats() {
        log.info("$scheduledStart update user stats.")
        var count = 0
        var generationTime: Long = 0
        val userUpdateTime = measureTimeMillis {
            val users = userRepo.findTop100ByUpdateStatsTrue()
            count = users.size
            users
                    .forEach {
                        var dataNullable: UserSearchResult? = null
                        val singleGenTime = measureTimeMillis {
                            dataNullable = it.generateSearchResult()
                        }
                        val data = dataNullable!!
                        generationTime += singleGenTime
                        userRepo.updateUserStats(
                                it.id,
                                data.deckCount,
                                data.forSaleCount,
                                data.topSasAverage,
                                data.highSas,
                                data.lowSas,
                                data.totalPower,
                                data.totalChains,
                                data.mavericks,
                                data.anomalies
                        )
                    }
        }

        this.updateSearchResults()

        log.info("$scheduledStop Updated $count users in $userUpdateTime ms gen time $generationTime ms")
    }

    fun currentSearchResults() = UserSearchResults(
            updatedMinutesAgo = Duration.between(this.lastUserSearchUpdate, Instant.now()).abs().toMinutes(),
            users = this.allSearchableUsers
    )

    fun updateSearchResults() {
        allSearchableUsers = searchUsers(UserFilters())
        lastUserSearchUpdate = Instant.now()
    }

    fun scheduleUserForUpdate(user: KeyUser) {
        userRepo.setUpdateUserTrue(user.id)
    }

    fun searchUsers(filters: UserFilters): List<UserSearchResult> {
        val userQ = QKeyUser.keyUser
        val predicate = userFilterPredicate(filters)

        val sort = when (filters.sort) {
            UserSort.DECK_COUNT ->
                userQ.deckCount.desc()
            UserSort.SAS_AVERAGE ->
                userQ.topSasAverage.desc()
            UserSort.TOP_SAS ->
                userQ.highSas.desc()
            UserSort.LOW_SAS ->
                userQ.lowSas.asc()
            UserSort.FOR_SALE_COUNT ->
                userQ.forSaleCount.desc()
            UserSort.PATRON_LEVEL ->
                userQ.patreonTier.desc()
            UserSort.TOTAL_POWER ->
                userQ.totalPower.desc()
            UserSort.TOTAL_CHAINS ->
                userQ.totalChains.desc()
            UserSort.USER_NAME ->
                userQ.username.asc()
        }

//        val count = query
//                .select(userQ.id)
//                .from(userQ)
//                .where(predicate)
//                .fetch()
//                .count()
//                .toLong()

        return query
                .select(
                        Projections.constructor(UserSearchResult::class.java,
                                userQ.username, userQ.deckCount, userQ.forSaleCount, userQ.topSasAverage, userQ.highSas,
                                userQ.lowSas, userQ.totalPower, userQ.totalChains, userQ.mavericks, userQ.anomalies, userQ.patreonTier
                        )
                )
                .from(userQ)
                .where(predicate)
                .orderBy(sort)
                .fetch()
    }

    private fun userFilterPredicate(filters: UserFilters): Predicate {
        val userQ = QKeyUser.keyUser
        val predicate = BooleanBuilder()

        predicate.and(userQ.allowUsersToSeeDeckOwnership.isTrue)

        when (filters.sort) {
            UserSort.DECK_COUNT ->
                predicate.and(userQ.deckCount.gt(0))
            UserSort.SAS_AVERAGE ->
                predicate.and(userQ.deckCount.gt(0))
            UserSort.TOP_SAS ->
                predicate.and(userQ.deckCount.gt(0))
            UserSort.LOW_SAS ->
                predicate.and(userQ.deckCount.gt(0))
            UserSort.FOR_SALE_COUNT ->
                predicate.and(userQ.forSaleCount.gt(0))
            UserSort.PATRON_LEVEL ->
                predicate.and(userQ.patreonTier.isNotNull)
            UserSort.TOTAL_POWER ->
                predicate.and(userQ.totalPower.gt(0))
            UserSort.TOTAL_CHAINS ->
                predicate.and(userQ.totalChains.gt(0))
            else -> {
                // do nothing
            }
        }

        if (!filters.username.isNullOrBlank()) {
            filters.username.tokenize().forEach { predicate.and(userQ.username.likeIgnoreCase("%$it%")) }
        }

        return predicate
    }
}