import {now, removeUndefined, uniq} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {getTagValue, getTags, getTagValues} from "@welshman/util"

export type PollType = "singlechoice" | "multiplechoice"

export type PollOption = {
  id: string
  label: string
  votes: number
}

export const getPollType = (event: TrustedEvent): PollType =>
  getTagValue("polltype", event.tags) === "multiplechoice" ? "multiplechoice" : "singlechoice"

export const getPollOptions = (event: TrustedEvent) =>
  removeUndefined(
    getTags("option", event.tags).map(tag => {
      const [, id, label = id] = tag

      if (!id) return undefined

      return {id, label}
    }),
  )

export const getPollEndsAt = (event: TrustedEvent) => {
  const endsAt = getTagValue("endsAt", event.tags)

  if (!endsAt) return undefined

  const timestamp = parseInt(endsAt)

  return Number.isNaN(timestamp) ? undefined : timestamp
}

export const isPollClosed = (event: TrustedEvent) => {
  const endsAt = getPollEndsAt(event)

  return typeof endsAt === "number" ? endsAt <= now() : false
}

export const getPollResponseSelections = (event: TrustedEvent, pollType = getPollType(event)) => {
  const selections = getTagValues("response", event.tags)

  return pollType === "singlechoice" ? selections.slice(0, 1) : uniq(selections)
}

export const getPollResults = (event: TrustedEvent, responses: TrustedEvent[]) => {
  const options = getPollOptions(event).map(option => ({...option, votes: 0}))
  const counts = new Map(options.map(option => [option.id, option]))
  const latestByPubkey = new Map<string, TrustedEvent>()

  for (const response of responses) {
    const current = latestByPubkey.get(response.pubkey)

    if (!current || response.created_at > current.created_at) {
      latestByPubkey.set(response.pubkey, response)
    }
  }

  for (const response of latestByPubkey.values()) {
    for (const optionId of getPollResponseSelections(response, getPollType(event))) {
      const option = counts.get(optionId)

      if (option) {
        option.votes += 1
      }
    }
  }

  return {
    options,
    voters: latestByPubkey.size,
  }
}
