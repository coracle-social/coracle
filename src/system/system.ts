import {first} from "hurdak/lib/hurdak"
import {Sync} from "src/system/components/Sync"
import {Network} from "src/system/components/Network"
import {Meta} from "src/system/components/Meta"
import {User} from "src/system/components/User"
import {Directory} from "src/system/stores/Directory"
import {Routing} from "src/system/stores/Routing"
import {Content} from "src/system/stores/Content"
import {Nip57} from "src/system/stores/Nip57"
import {Chat} from "src/system/stores/Chat"
import {Nip05} from "src/system/stores/Nip05"
import {Cache} from "src/system/stores/Cache"
import {Social} from "src/system/stores/Social"
import {Alerts} from "src/system/stores/Alerts"
import {PubkeyLoader} from "src/system/util/PubkeyLoader"
import {Builder} from "src/system/util/Builder"

export type SystemEnv = {
  DUFFLEPUD_URL?: string
  MULTIPLEXTR_URL?: string
  FORCE_RELAYS?: string[]
  COUNT_RELAYS: string[]
  SEARCH_RELAYS: string[]
  DEFAULT_RELAYS: string[]
}

export interface System {
  ns: string
  env: SystemEnv
  sync: Sync
  network: Network
  meta: Meta
  user: User
  cache: Cache
  content: Content
  directory: Directory
  nip05: Nip05
  nip57: Nip57
  social: Social
  routing: Routing
  alerts: Alerts
  chat: Chat
  builder: Builder
  pubkeyLoader: PubkeyLoader
}

export class DefaultSystem implements System {
  ns: string
  env: SystemEnv
  sync: Sync
  network: Network
  meta: Meta
  user: User
  cache: Cache
  content: Content
  directory: Directory
  nip05: Nip05
  nip57: Nip57
  social: Social
  routing: Routing
  alerts: Alerts
  chat: Chat
  builder: Builder
  pubkeyLoader: PubkeyLoader

  constructor(ns, env) {
    this.ns = ns
    this.env = env

    // Core components
    this.sync = DefaultSystem.getSync(this)
    this.network = DefaultSystem.getNetwork(this)
    this.meta = DefaultSystem.getMeta(this)
    this.user = DefaultSystem.getUser(this)

    // Data stores
    this.cache = DefaultSystem.getCache(this)
    this.content = DefaultSystem.getContent(this)
    this.directory = DefaultSystem.getDirectory(this)
    this.nip05 = DefaultSystem.getNip05(this)
    this.nip57 = DefaultSystem.getNip57(this)
    this.social = DefaultSystem.getSocial(this)
    this.routing = DefaultSystem.getRouting(this)
    this.alerts = DefaultSystem.getAlerts(this)
    this.chat = DefaultSystem.getChat(this)

    // Extra utils
    this.builder = DefaultSystem.getBuilder(this)
    this.pubkeyLoader = DefaultSystem.getPubkeyLoader(this)
  }

  static getSync = system =>
    new Sync(system, {
      getUserPubkey: () => system.user.getPubkey(),
      getPubkeyWhitelist: () => {
        const pubkey = system.user.getPubkey()

        if (!pubkey) {
          return null
        }

        const follows = system.user.getFollowsSet()

        follows.add(pubkey)

        return follows
      },
    })

  static getNetwork = system =>
    new Network({
      getMultiplextrUrl: () => system.user.getSetting("multiplextr_url"),
      processEvents: events => system.sync.processEvents(events),
      getRelayInfo: url => system.routing.getRelayInfo(url),
      forceRelays: system.env.FORCE_RELAYS,
      countRelays: system.env.COUNT_RELAYS,
    })

  static getMeta = system =>
    new Meta({
      network: system.network,
    })

  static getUser = system => new User(system)

  static getCache = system => new Cache(system.sync)

  static getContent = system => new Content(system.sync)

  static getDirectory = system => new Directory(system.sync)

  static getNip05 = system => new Nip05(system.sync)

  static getNip57 = system => new Nip57(system.sync)

  static getSocial = system => new Social(system.sync)

  static getRouting = system =>
    new Routing(system.sync, {
      getDefaultRelays: () => system.user.getRelayUrls().concat(system.env.DEFAULT_RELAYS),
      relayHasError: url =>
        Boolean(
          system.network.pool.get(url, {autoConnect: false})?.error ||
            first(system.meta.getRelayQuality(url)) < 0.5
        ),
    })

  static getAlerts = system =>
    new Alerts(system.sync, {
      getUserPubkey: () => system.user.getPubkey(),
      isUserEvent: e => system.user.isUserEvent(e),
      isMuted: e => system.user.isMuted(e),
    })

  static getChat = system =>
    new Chat(system.sync, {
      getCrypt: () => system.user.crypt,
    })

  static getBuilder = system =>
    new Builder({
      getEventHint: event => first(system.routing.getEventHints(1, event)) || "",
      getPubkeyHint: pubkey => first(system.routing.getPubkeyHints(1, pubkey)) || "",
      getPubkeyPetname: pubkey => {
        const profile = system.directory.getProfile(pubkey)

        return profile ? system.directory.displayProfile(profile) : ""
      },
    })

  static getPubkeyLoader = system =>
    new PubkeyLoader({
      getLastUpdated: pubkey => system.directory.profiles.get(pubkey)?.updated_at || 0,
      getChunkRelays: pubkeys =>
        system.routing.mergeHints(
          system.user.getSetting("relay_limit"),
          pubkeys.map(pubkey => system.routing.getPubkeyHints(3, pubkey))
        ),
      loadChunk: ({filter, relays}) => system.network.load({filter, relays}),
    })
}
