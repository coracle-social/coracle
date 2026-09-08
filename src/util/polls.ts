import type {TrustedEvent} from "@welshman/util"
import {inbox, relays as relaySelections} from "@welshman/util"
import {Poll, PollResponse} from "@welshman/domain"
import type {PollType} from "@welshman/domain"
import {reader} from "src/engine/core"

export type {PollType}

export const getPollType = (event: TrustedEvent): PollType =>
  reader(Poll)(event).pollType() === "multiplechoice" ? "multiplechoice" : "singlechoice"

export const getPollOptions = (event: TrustedEvent) =>
  reader(Poll)(event)
    .options()
    .filter(option => Boolean(option.id))

export const getPollEndsAt = (event: TrustedEvent) => reader(Poll)(event).endsAt()

export const isPollClosed = (event: TrustedEvent) => reader(Poll)(event).isClosed()

export const getPollRelaySelections = (event: TrustedEvent) => [
  ...relaySelections(reader(Poll)(event).urls()),
  inbox(event.pubkey),
]

export const getPollResponseSelections = (event: TrustedEvent, pollType = getPollType(event)) => {
  const selections = reader(PollResponse)(event).selections()

  return pollType === "singlechoice" ? selections.slice(0, 1) : selections
}

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
