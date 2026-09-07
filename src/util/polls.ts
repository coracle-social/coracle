import type {TrustedEvent} from "@welshman/util"
import {Poll, PollResponse} from "@welshman/domain"
import type {PollType} from "@welshman/domain"
import {reader} from "src/engine/core"

export type {PollType}

// A poll type coracle doesn't know is a single choice poll; PollReader.pollType() passes the tag's
// value through, so anything but "singlechoice" would count as multiple choice.
export const getPollType = (event: TrustedEvent): PollType =>
  reader(Poll)(event).pollType() === "multiplechoice" ? "multiplechoice" : "singlechoice"

// PollReader.options() keeps ["option"] tags with no id; an option nobody can vote for isn't worth
// rendering, so drop them the way coracle always has.
export const getPollOptions = (event: TrustedEvent) =>
  reader(Poll)(event)
    .options()
    .filter(option => Boolean(option.id))

export const getPollEndsAt = (event: TrustedEvent) => reader(Poll)(event).endsAt()

export const isPollClosed = (event: TrustedEvent) => reader(Poll)(event).isClosed()

export const getPollResponseSelections = (event: TrustedEvent, pollType = getPollType(event)) => {
  const selections = reader(PollResponse)(event).selections()

  return pollType === "singlechoice" ? selections.slice(0, 1) : selections
}

// One response per pubkey, most recent wins
const getLatestResponses = (responses: TrustedEvent[]) => {
  const byPubkey = new Map<string, TrustedEvent>()

  for (const response of responses) {
    const current = byPubkey.get(response.pubkey)

    if (!current || response.created_at > current.created_at) {
      byPubkey.set(response.pubkey, response)
    }
  }

  return Array.from(byPubkey.values())
}

// Not PollReader.results(), which reads its options and poll type off the reader directly and so
// misses both normalizations above
export const getPollResults = (event: TrustedEvent, responses: TrustedEvent[]) => {
  const pollType = getPollType(event)
  const options = getPollOptions(event).map(option => ({...option, votes: 0}))
  const counts = new Map(options.map(option => [option.id, option]))
  const latestResponses = getLatestResponses(responses)

  for (const response of latestResponses) {
    for (const optionId of getPollResponseSelections(response, pollType)) {
      const option = counts.get(optionId)

      if (option) {
        option.votes += 1
      }
    }
  }

  return {options, voters: latestResponses.length}
}

export const getPollVotersByOption = (event: TrustedEvent, responses: TrustedEvent[]) => {
  const pollType = getPollType(event)
  const votersByOption = new Map<string, string[]>()

  for (const response of getLatestResponses(responses)) {
    for (const optionId of getPollResponseSelections(response, pollType)) {
      const voters = votersByOption.get(optionId) || []

      voters.push(response.pubkey)
      votersByOption.set(optionId, voters)
    }
  }

  return votersByOption
}
