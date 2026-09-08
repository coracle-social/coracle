import {relays as relaySelections} from "@welshman/util"
import {
  KindFactory,
  PollResponse,
  PollResponseQuery,
  PollResponseReader,
  PollResponseWriter,
} from "@welshman/domain"

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
  query: PollResponseQuery,
})
