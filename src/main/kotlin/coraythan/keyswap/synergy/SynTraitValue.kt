package coraythan.keyswap.synergy

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import coraythan.keyswap.cards.CardType
import coraythan.keyswap.cards.ExtraCardInfo
import coraythan.keyswap.generatets.GenerateTs
import coraythan.keyswap.generatets.TsIgnore
import coraythan.keyswap.generatets.TsOptional
import coraythan.keyswap.startCase
import java.util.*
import javax.persistence.*

@GenerateTs
@Entity
data class SynTraitValue(
        @Enumerated(EnumType.STRING)
        val trait: SynergyTrait,
        val rating: Int = 3,
        @Enumerated(EnumType.STRING)
        val house: SynTraitHouse = SynTraitHouse.anyHouse,

        @Enumerated(EnumType.STRING)
        val player: SynTraitPlayer = SynTraitPlayer.ANY,

        @Transient
        @JsonIgnore
        val cardTypesInitial: List<CardType>? = listOf(),

        @TsIgnore
        var cardTypesString: String = "",
        /**
         * Creature power expression, one of:
         *
         * ['odd','even','2-5','2 or less','3+','3,5,7']
         */
        var powersString: String = "",
        @TsIgnore
        var cardTraitsString: String = "",
        val notCardTraits: Boolean = false,

        @TsIgnore
        @JsonIgnoreProperties("traits")
        @ManyToOne
        val traitInfo: ExtraCardInfo? = null,

        @TsIgnore
        @JsonIgnoreProperties("synergies")
        @ManyToOne
        val synergyInfo: ExtraCardInfo? = null,

        val cardName: String? = null,

        val synergyGroup: String? = null,
        val synergyGroupMax: Int? = null,
        val primaryGroup: Boolean = false,

        @TsOptional
        @Id
        val id: UUID = UUID.randomUUID()
) : Comparable<SynTraitValue> {
    override fun compareTo(other: SynTraitValue): Int {
        return other.rating - this.rating
    }

    fun strength() = when (rating) {
        1 -> TraitStrength.EXTRA_WEAK
        2 -> TraitStrength.WEAK
        3 -> TraitStrength.NORMAL
        4 -> TraitStrength.STRONG
        else -> TraitStrength.NORMAL
    }

    override fun toString(): String {
        return "SynTraitValue(trait=$trait, rating=$rating, type=$house, player=$player, cardTypes=$cardTypesString traitInfoId=${traitInfo?.id}, synergyInfoId=${synergyInfo?.id}, id=$id)"
    }

    var cardTypes: List<CardType>
        get() {
            return cardTypesString.split("-").mapNotNull { if (it.isBlank()) null else CardType.valueOf(it) }
        }
        set(cardTypes) {
            cardTypesString = cardTypes.joinToString("-")
        }

    var cardTraits: List<String>
        get() {
            return cardTraitsString.split("-").filter { !it.isBlank() }
        }
        set(cardTraits) {
            cardTraitsString = cardTraits.joinToString("-")
        }

    init {
        if (!cardTypesInitial.isNullOrEmpty()) {
            this.cardTypes = cardTypesInitial
        }
    }

    fun powerMatch(power: Int, cardType: CardType? = CardType.Creature): Boolean {
        return when {
            powersString.isBlank() -> {
                true
            }
            cardType != CardType.Creature && cardType != CardType.TokenCreature -> {
                false
            }
            powersString == "even" -> {
                power % 2 == 0
            }
            powersString == "odd" -> {
                power % 2 != 0
            }
            powersString.contains(" or less") -> {
                power <= powersString.replace(" or less", "").toInt()
            }
            powersString.contains("+") -> {
                power >= powersString.replace("+", "").toInt()
            }
            powersString.contains("-") -> {
                val nums = powersString.split("-")
                power >= nums[0].toInt() && power <= nums[1].toInt()
            }
            powersString.contains(",") -> {
                val nums = powersString.split(",")
                nums.any { power == it.toInt() }
            }
            powersString.toIntOrNull() != null -> {
                powersString.toInt() == power
            }
            else -> {
                throw IllegalStateException("Invalid power string: $powersString")
            }
        }
    }

    fun validate() {
        powerMatch(1)
    }

    fun print(): String {
        var name = if (trait == SynergyTrait.any) "" else trait.toString()
        if (cardName != null) {
            name = cardName
        }
        var nameEnhancer = ""
        if (powersString.isNotBlank()) {
            nameEnhancer += " $powersString Power"
        }
        if (player != SynTraitPlayer.ANY) {
            nameEnhancer += " ${player.toString().lowercase().replaceFirstChar { cap -> cap.uppercase() }}"
        }
        if (cardTraits.isNotEmpty()) {
            nameEnhancer += " ${if (notCardTraits) "Non-" else ""}${cardTraits.joinToString(", ") { it.lowercase().replaceFirstChar { cap -> cap.uppercase() } }}"
        }
        if (cardTypes.isNotEmpty()) {
            nameEnhancer += if (cardTypes.size == 1) {
                " ${cardTypes[0]}s"
            } else {
                " ${cardTypes.joinToString(" ") { "${it}s" }}"
            }
        }
        name = if (name.contains("_R_")) {
            name.startCase().replace("_ R_", nameEnhancer)
        } else {
            "${name.startCase()} $nameEnhancer"
        }
        name = when (house) {
            SynTraitHouse.anyHouse -> ""
            SynTraitHouse.continuous -> "Omni: "
            SynTraitHouse.outOfHouse -> "Out of House: "
            SynTraitHouse.house -> "In House: "
        } + name

        name += when (rating) {
            1 -> " +"
            2 -> " ++"
            3 -> " +++"
            4 -> " ++++"
            -1 -> " -"
            -2 -> " --"
            -3 -> " ---"
            -4 -> " ----"
            else -> ""
        }

        return name
    }

}

fun Collection<SynTraitValue>.containsTrait(trait: SynergyTrait, player: SynTraitPlayer? = null) = this.find {
    valueTrait -> valueTrait.trait == trait && (player == null || player == valueTrait.player)
} != null
