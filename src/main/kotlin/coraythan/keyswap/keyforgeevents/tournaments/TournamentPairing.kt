package coraythan.keyswap.keyforgeevents.tournamentdecks

import coraythan.keyswap.generatets.GenerateTs
import org.springframework.data.repository.CrudRepository
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id

@Entity
data class TournamentPairing(

        val pairingTable: Int,

        val playerOneId: Long,
        val playerTwoId: Long?,

        val tournamentId: Long,
        val roundId: Long,

        val playerOneScore: Int? = null,
        val playerTwoScore: Int? = null,
        val playerOneWins: Int = 0,
        val playerTwoWins: Int = 0,

        val playerOneWon: Boolean? = null,

        val tcoLink: String? = null,

        @Id
        @GeneratedValue(strategy = GenerationType.AUTO)
        val id: Long = -1,
)

interface TournamentPairingRepo : CrudRepository<TournamentPairing, Long> {
    fun findAllByTournamentId(tournamentId: Long): List<TournamentPairing>
    fun findAllByRoundId(roundId: Long): List<TournamentPairing>
    fun deleteAllByRoundId(roundId: Long)

    fun existsByRoundIdAndPlayerOneWonIsNull(roundId: Long): Boolean

    fun deleteAllByTournamentId(tournamentId: Long)
}

@GenerateTs
data class TournamentPairingPlayers(
        val pairingTable: Int,
        val playerOneId: Long,
        val playerTwoId: Long?,
        val bye: Boolean,
)
