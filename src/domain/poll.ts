import {relays as relaySelections} from "@welshman/util"
import {KindFactory, PollResponse, PollResponseReader, PollResponseWriter} from "@welshman/domain"

// Nip 88 lets a poll nominate the relays it wants its responses on. Welshman's writer routes a
// vote like any other event — to the voter's own relays and the poll author's — so add them here,
// and the command knows where a vote goes without the call site working it out.
export class PollVoteWriter extends PollResponseWriter {
  pollUrls: string[] = []

  setPollUrls(urls: string[]) {
    this.pollUrls = urls

    return this
  }

  protected async renderRoutes() {
    return [...(await super.renderRoutes()), ...relaySelections(this.pollUrls)]
  }
}

export const PollVote = new KindFactory({
  kind: PollResponse.kind,
  reader: PollResponseReader,
  writer: PollVoteWriter,
})
