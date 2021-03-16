package coraythan.keyswap.keyforgeevents.tournaments

import coraythan.keyswap.Api
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Api.base}/tournaments")
class TournamentEndpoints(
        private val tournamentService: TournamentService
) {

    @GetMapping("/{id}")
    fun findTourneyInfo(@PathVariable id: Long) = tournamentService.findTourneyInfo(id)

    @PostMapping("/secured/{id}/{privateTournament}")
    fun createTourneyForEvent(@PathVariable id: Long, @PathVariable privateTournament: Boolean) = tournamentService.createTourneyForEvent(id, privateTournament)

    @PostMapping("/secured/{id}/pair-next-round")
    fun pairNextRound(@PathVariable id: Long) = tournamentService.pairNextRound(id)

    @PostMapping("/secured/{id}/start-current-round")
    fun startCurrentRound(@PathVariable id: Long) = tournamentService.startCurrentRound(id)

    @PostMapping("/secured/{id}/end-tournament/{end}")
    fun endTournament(@PathVariable id: Long, @PathVariable end: Boolean) = tournamentService.endTournament(id, end)

    @PostMapping("/secured/{id}/add-deck/{deckId}/{username}")
    fun addDeck(@PathVariable id: Long, @PathVariable deckId: String, @PathVariable username: String) = tournamentService.addDeck(id, deckId, username)

    @PostMapping("/secured/{id}/add-participant/{username}")
    fun addParticipant(@PathVariable id: Long, @PathVariable username: String) = tournamentService.addParticipant(id, username)

    @PostMapping("/secured/{id}/drop-participant/{username}/{drop}")
    fun dropParticipant(@PathVariable id: Long, @PathVariable username: String, @PathVariable drop: Boolean) = tournamentService.dropParticipant(id, username, drop)

    @PostMapping("/secured/report-results")
    fun reportResults(@RequestBody results: TournamentResults) = tournamentService.reportResults(results)
}