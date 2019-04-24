package coraythan.keyswap.auctions

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import coraythan.keyswap.decks.models.Deck
import coraythan.keyswap.decks.models.DeckLanguage
import coraythan.keyswap.generic.Country
import coraythan.keyswap.now
import coraythan.keyswap.userdeck.DeckCondition
import coraythan.keyswap.users.KeyUser
import java.time.ZonedDateTime
import java.util.*
import javax.persistence.*

@Entity
data class Auction(

        val durationDays: Int = 7,

        val endDateTime: ZonedDateTime,

        val bidIncrement: Int = 5,

        val startingBid: Int = 0,

        val buyItNow: Int? = null,

        @JsonIgnoreProperties("buyItNows")
        @ManyToOne
        val boughtWithBuyItNow: KeyUser? = null,

        val boughtNowOn: ZonedDateTime? = null,

        @Enumerated(EnumType.STRING)
        val status: AuctionStatus = AuctionStatus.ACTIVE,

        @JsonIgnoreProperties("auction")
        @OneToMany(mappedBy = "auction", cascade = [CascadeType.ALL])
        val bids: List<AuctionBid> = listOf(),

        @JsonIgnoreProperties("auctions")
        @ManyToOne
        val deck: Deck,

        @JsonIgnoreProperties("auctions")
        @ManyToOne
        val seller: KeyUser,

        val currencySymbol: String,

        @Enumerated(EnumType.STRING)
        val forSaleInCountry: Country,

        @Enumerated(EnumType.STRING)
        val language: DeckLanguage,

        val condition: DeckCondition? = null,
        val redeemed: Boolean = true,
        val externalLink: String? = null,
        val listingInfo: String? = null,

        val dateListed: ZonedDateTime = now(),

        @Id
        val id: UUID = UUID.randomUUID()
) {
    fun realMaxBidObject() = bids.sortedBy { it.bid }.reversed().firstOrNull()
    fun realMaxBid() = realMaxBidObject()?.bid

    fun highestBidder() = bids.sortedByDescending { it.bid }.firstOrNull()?.bidder

    val highestBid: Int?
        get() {
            val bidsFiltered = bids
                    .groupBy { it.bidder }
                    .map { bid -> bid.value.sortedByDescending { it.bid }.first() }
            return when {
                bidsFiltered.isEmpty() -> null
                bidsFiltered.size == 1 -> startingBid
                else -> bidsFiltered.sortedByDescending { it.bid }[1].bid
            }
        }

    val highestBidderUsername: String?
        get() = highestBidder()?.username

    val nextBid: Int
        get() {
            val highBid = highestBid
            return if (highBid == null) {
                startingBid
            } else {
                highBid + bidIncrement
            }
        }

    fun toDto(offsetMinutes: Int = 0): AuctionDto {
        val highestBid = highestBid
        return AuctionDto(
                durationDays = durationDays,
                endDateTime = endDateTime,
                bidIncrement = bidIncrement,
                startingBid = startingBid,
                buyItNow = buyItNow,
                status = status,
                highestBid = highestBid,
                bids = bids
                        .sortedByDescending { it.bidTime }
                        .map {
                            it.toDto(offsetMinutes).copy(bid = if (highestBid != null && it.bid > highestBid) highestBid else it.bid)
                        },
                deckId = deck.id,
                currencySymbol = currencySymbol,
                id = id
        )
    }
}

data class AuctionDto(
        val durationDays: Int = 7,
        val endDateTime: ZonedDateTime,
        val bidIncrement: Int = 5,
        val startingBid: Int = 0,
        val buyItNow: Int? = null,
        val status: AuctionStatus = AuctionStatus.ACTIVE,
        val highestBid: Int? = null,
        val bids: List<AuctionBidDto> = listOf(),
        val deckId: Long,
        val currencySymbol: String,
        val id: UUID
)

enum class AuctionStatus {
    ACTIVE,
    COMPLETE
}