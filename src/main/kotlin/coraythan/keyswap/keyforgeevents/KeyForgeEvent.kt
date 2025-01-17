package coraythan.keyswap.keyforgeevents

import coraythan.keyswap.generatets.GenerateTs
import coraythan.keyswap.generic.Country
import coraythan.keyswap.generic.USState
import coraythan.keyswap.nowLocal
import coraythan.keyswap.users.KeyUser
import java.time.LocalDateTime
import javax.persistence.*

@Entity
data class KeyForgeEvent(
        val name: String,
        val description: String,
        val startDateTime: LocalDateTime,
        val banner: String?,
        val entryFee: String?,
        val duration: String?,
        val signupLink: String,
        val discordServer: String?,
        val online: Boolean,
        val sealed: Boolean,

        @Enumerated(EnumType.STRING)
        val format: KeyForgeFormat,

        @Enumerated(EnumType.STRING)
        val country: Country?,

        @Enumerated(EnumType.STRING)
        val state: USState?,

        @ManyToOne
        val createdBy: KeyUser,
        val promoted: Boolean,

        val tournamentOnly: Boolean = false,

        val tourneyId: Long? = null,

        val created: LocalDateTime = nowLocal(),

        val minutesPerRound: Int? = null,

        @Id
        @GeneratedValue(strategy = GenerationType.AUTO)
        val id: Long = -1,
) {
        fun toDto() = KeyForgeEventDto(
                name,
                description,
                startDateTime,
                banner,
                entryFee,
                duration,
                signupLink,
                discordServer,
                online,
                sealed,
                tournamentOnly,
                tourneyId,
                minutesPerRound,
                format,
                country,
                state,
                createdByUsername = createdBy.username,
                id,
        )
}

@GenerateTs
data class KeyForgeEventDto(
        val name: String,
        val description: String,
        val startDateTime: LocalDateTime,
        val banner: String?,
        val entryFee: String?,
        val duration: String?,
        val signupLink: String,
        val discordServer: String?,
        val online: Boolean,
        val sealed: Boolean,
        val tournamentOnly: Boolean,
        val tourneyId: Long?,
        val minutesPerRound: Int?,

        val format: KeyForgeFormat,
        val country: Country?,

        val state: USState?,

        val createdByUsername: String?,
        val id: Long?
)
