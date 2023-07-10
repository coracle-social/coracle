import {prop, nth, sortBy} from "ramda"
import {User} from "src/system/user"
import {Sync} from "src/system/sync"
import {Social} from "src/system/social"
import {Directory} from "src/system/directory"
import {Nip05} from "src/system/nip05"
import {Nip57} from "src/system/nip57"
import {Content} from "src/system/content"
import {Routing} from "src/system/routing"
import {Cache} from "src/system/cache"
import {Chat} from "src/system/chat"
import {Alerts} from "src/system/alerts"
import {Network} from "src/system/network"
import {Outbox} from "src/system/outbox"
import {Builder} from "src/system/builder"
import {Meta} from "src/system/meta"

export class System {
  ns: string
  user: User
  sync: Sync
  social: Social
  directory: Directory
  nip05: Nip05
  nip57: Nip57
  routing: Routing
  cache: Cache
  chat: Chat
  alerts: Alerts
  content: Content
  network: Network
  builder: Builder
  outbox: Outbox
  meta: Meta

  constructor(ns) {
    this.ns = ns
    this.sync = new Sync(this)
    this.user = new User(this)
    this.social = new Social(this)
    this.directory = new Directory(this)
    this.nip05 = new Nip05(this)
    this.nip57 = new Nip57(this)
    this.routing = new Routing(this)
    this.cache = new Cache(this)
    this.chat = new Chat(this)
    this.alerts = new Alerts(this)
    this.content = new Content(this)
    this.network = new Network(this)
    this.builder = new Builder(this)
    this.outbox = new Outbox(this)
    this.meta = new Meta(this)
  }

  key = key => `${this.ns}/${key}`

  // For use with table.sort to avoid deleting the user's own info or those of
  // direct follows
  sortByGraph = xs => {
    const pubkey = this.user.getPubkey()

    if (pubkey) {
      const follows = this.social.graph.get(pubkey).petnames || []
      const whitelist = new Set(follows.map(nth(1)).concat(pubkey))

      return sortBy(x => (whitelist.has(x.pubkey) ? 0 : x.updated_at), xs)
    } else {
      return sortBy(prop("updated_at"))
    }
  }
}
