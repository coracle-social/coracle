import {find, pluck, whereEq} from "ramda"
import {batch, sleep} from "hurdak"
import {Tags} from "paravel"
import {env} from "src/engine/session/state"
import {subscribe, loadOne, getIdFilters, dvmRequest} from "src/engine/network/utils"
import {selectHintsWithFallback, mergeHints} from "src/engine/relays/utils"

export const dereferenceNote = async ({
  eid = null,
  kind = null,
  pubkey = null,
  identifier = null,
  relays = [],
  context = [],
}) => {
  if (eid) {
    const note = find(whereEq({id: eid}), context)

    if (note) {
      return note
    }

    return loadOne({
      relays: selectHintsWithFallback(relays),
      filters: getIdFilters([eid]),
    })
  }

  if (kind && pubkey) {
    const note = find(e => {
      if (!whereEq({kind, pubkey}, e)) {
        return false
      }

      return !identifier || Tags.fromEvent(e).get("d")?.value() === identifier
    }, context)

    if (note) {
      return note
    }

    return new Promise(resolve => {
      let note = null

      subscribe({
        timeout: 3000,
        closeOnEose: true,
        relays: selectHintsWithFallback(relays),
        filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
        onClose: () => resolve(note),
        onEvent: event => {
          note = note?.created_at > event.created_at ? note : event
        },
      })
    })
  }

  return null
}

type LoadReactionsRequest = {
  id: string
  relays: string[]
  onProgress: (n: number) => void
  onResult: (n: number) => void
}

const executeLoadReactions = batch(500, async (requests: LoadReactionsRequest[]) => {
  const ids = pluck("id", requests)
  const relays = mergeHints(pluck("relays", requests))

  let data = {}

  const e = await dvmRequest({
    kind: 5400,
    timeout: 10000,
    relays: env.get().DVM_RELAYS,
    input: [{kinds: [7], "#e": ids}],
    tags: [...relays.map(url => ["param", "relay", url]), ["param", "group", "reply"]],
    onProgress: e => {
      data = JSON.parse(e.content)

      for (const {id, onProgress} of requests) {
        onProgress(data[id] || 0)
      }
    },
  })

  if (e) {
    data = JSON.parse(e.content)
  }

  for (const {id, onResult} of requests) {
    onResult(data[id] || 0)
  }
})

export async function* loadReactions(id: string, relays: string[]) {
  let count = 0
  let done = false

  executeLoadReactions({
    id,
    relays,
    onProgress: n => {
      count = n
    },
    onResult: n => {
      count = n
      done = true
    },
  })

  while (!done) {
    await sleep(300)

    if (count > 0) {
      yield count
    }
  }

  yield count
}
