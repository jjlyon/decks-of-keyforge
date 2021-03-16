package coraythan.keyswap.keyforgeevents.tournamentdecks

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import coraythan.keyswap.keyforgeevents.tournaments.Tournament
import org.springframework.data.repository.CrudRepository
import javax.persistence.*

@Entity
data class TournamentRound(

        @JsonIgnoreProperties("rounds")
        @ManyToOne
        val tourney: Tournament,

        val roundNumber: Int,

        val active: Boolean = false,

        @Id
        @GeneratedValue(strategy = GenerationType.AUTO)
        val id: Long = -1,
)

interface TournamentRoundRepo : CrudRepository<TournamentRound, Long> {
    fun findFirstByTourneyIdOrderByRoundNumberDesc(id: Long): TournamentRound?
}