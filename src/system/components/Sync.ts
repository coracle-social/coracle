import {identity, sortBy, prop} from "ramda"
import {ensurePlural, chunk} from "hurdak/lib/hurdak"
import {Table} from "src/util/loki"
import {sleep, synced} from "src/util/misc"
import type {SystemEnv} from "src/system/System"

type SyncOpts = {
  getUserPubkey: () => null | string
  getPubkeyWhitelist: () => null | Set<string>
}

export class Sync {
  ns: string
  env: SystemEnv
  stores = {}
  handlers = {}
  ANY_KIND: string
  getUserPubkey: SyncOpts["getUserPubkey"]
  getPubkeyWhitelist: SyncOpts["getPubkeyWhitelist"]

  constructor(system, {getUserPubkey, getPubkeyWhitelist}: SyncOpts) {
    this.ns = system.ns
    this.env = system.env
    this.ANY_KIND = this.key(this.key("ANY_KIND"))
    this.getUserPubkey = getUserPubkey
    this.getPubkeyWhitelist = getPubkeyWhitelist
  }

  key = key => `${this.ns}/${key}`

  table = <T>(name, pk, opts = {}) => new Table<T>(this.key(name), pk, opts)

  store = (name, defaultValue) => synced(this.key(name), defaultValue)

  addHandler(kind, f) {
    this.handlers[kind] = this.handlers[kind] || []
    this.handlers[kind].push(f)
  }

  sortByPubkeyWhitelist = xs => {
    const whitelist = this.getPubkeyWhitelist()

    const sort = sortBy(
      whitelist ? x => (whitelist.has(x.pubkey) ? 0 : x.updated_at) : prop("updated_at")
    )

    return sort(xs)
  }

  async processEvents(events) {
    const chunks = chunk(100, ensurePlural(events).filter(identity))

    for (let i = 0; i < chunks.length; i++) {
      for (const event of chunks[i]) {
        for (const handler of this.handlers[this.ANY_KIND] || []) {
          await handler(event)
        }

        for (const handler of this.handlers[event.kind] || []) {
          await handler(event)
        }
      }

      // Don't lock up the ui when processing a lot of events
      if (i < chunks.length - 1) {
        await sleep(30)
      }
    }
  }
}
