package coraythan.keyswap.cards

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.querydsl.QuerydslPredicateExecutor
import java.util.*

interface ExtraCardInfoRepo : JpaRepository<ExtraCardInfo, UUID>, QuerydslPredicateExecutor<ExtraCardInfo> {
    fun findByActiveTrue(): List<ExtraCardInfo>
    fun findFirstByActiveTrueOrderByVersionDesc(): ExtraCardInfo
    fun findByVersionLessThanAndActiveFalse(version: Int): List<ExtraCardInfo>
    fun findByCardName(cardName: String): List<ExtraCardInfo>

    fun findByPublishedNullAndVersionLessThanEqual(version: Int): List<ExtraCardInfo>
    fun findByPublishedNull(): List<ExtraCardInfo>

    fun existsByCardName(name: String): Boolean

    @Modifying
    @Query("UPDATE ExtraCardInfo extraCardInfo SET extraCardInfo.active = true, extraCardInfo.version = ?2 WHERE extraCardInfo.id = ?1")
    fun setActiveAndVersion(id: UUID, version: Int)
}
