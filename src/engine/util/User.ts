import {nth, when, prop, uniq, pluck, fromPairs, whereEq, find, reject} from "ramda"
import {now} from "src/util/misc"
import {appDataKeys, normalizeRelayUrl, findReplyId, findRootId} from "src/util/nostr"
import {derived} from "src/engine/util/store"
import type {Readable} from "src/engine/util/store"
import type {RelayPolicyEntry, List, Event} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

export class User {
  engine: Engine
  stateKey: Readable<string>
  followsSet: Readable<Set<string>>
  mutesSet: Readable<Set<string>>

  constructor(engine: Engine) {
    this.engine = engine

    const {Keys, Nip02} = engine

    this.followsSet = derived(
      [Nip02.graph.mapStore, Keys.stateKey],
      ([graph, stateKey]) => new Set(graph.get(stateKey)?.petnames.map(nth(1)))
    )

    this.mutesSet = derived(
      [Nip02.graph.mapStore, Keys.stateKey],
      ([graph, stateKey]) => new Set(graph.get(stateKey)?.mutes.map(nth(1)))
    )
  }

  // Settings

  setSettings = async (settings: Record<string, any>) => {
    this.engine.Settings.settings.update($settings => ({...$settings, ...settings}))

    if (this.engine.Keys.canSign.get()) {
      const d = appDataKeys.USER_SETTINGS
      const v = await this.engine.Crypt.encryptJson(settings)

      return this.engine.Outbox.publish({
        event: this.engine.Builder.setAppData(d, v),
        relays: this.getRelayUrls("write"),
      })
    }
  }

  setAppData = async (d: string, content: any) => {
    if (this.engine.Keys.canSign.get()) {
      const v = await this.engine.Crypt.encryptJson(content)

      return this.engine.Outbox.publish({
        event: this.engine.Builder.setAppData(d, v),
        relays: this.getRelayUrls("write"),
      })
    }
  }

  // Nip65

  getRelays = (mode?: string) =>
    this.engine.Nip65.getPubkeyRelays(this.engine.Keys.stateKey.get(), mode)

  getRelayUrls = (mode?: string) =>
    this.engine.Nip65.getPubkeyRelayUrls(this.engine.Keys.stateKey.get(), mode)

  setRelays = (relays: RelayPolicyEntry[]) => {
    if (this.engine.Keys.canSign.get()) {
      return this.engine.Outbox.publish({
        event: this.engine.Builder.setRelays(relays),
        relays: relays.map(r => r.url),
      })
    } else {
      this.engine.Nip65.setPolicy(
        {pubkey: this.engine.Keys.stateKey.get(), created_at: now()},
        relays
      )
    }
  }

  addRelay = (url: string) =>
    this.setRelays(this.getRelays().concat({url, read: true, write: true}))

  removeRelay = (url: string) =>
    this.setRelays(reject(whereEq({url: normalizeRelayUrl(url)}), this.getRelays()))

  setRelayPolicy = (url: string, policy: Partial<RelayPolicyEntry>) =>
    this.setRelays(this.getRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

  // Nip02

  getPetnames = () => this.engine.Nip02.getPetnames(this.engine.Keys.stateKey.get())

  getMutedTags = () => this.engine.Nip02.getMutedTags(this.engine.Keys.stateKey.get())

  getFollowsSet = () => this.engine.Nip02.getFollowsSet(this.engine.Keys.stateKey.get())

  getMutesSet = () => this.engine.Nip02.getMutesSet(this.engine.Keys.stateKey.get())

  getFollows = () => this.engine.Nip02.getFollows(this.engine.Keys.stateKey.get())

  getMutes = () => this.engine.Nip02.getMutes(this.engine.Keys.stateKey.get())

  getNetworkSet = () => this.engine.Nip02.getNetworkSet(this.engine.Keys.stateKey.get())

  getNetwork = () => this.engine.Nip02.getNetwork(this.engine.Keys.stateKey.get())

  isFollowing = (pubkey: string) =>
    this.engine.Nip02.isFollowing(this.engine.Keys.stateKey.get(), pubkey)

  isIgnoring = (pubkeyOrEventId: string) =>
    this.engine.Nip02.isIgnoring(this.engine.Keys.stateKey.get(), pubkeyOrEventId)

  setProfile = ($profile: Record<string, any>) =>
    this.engine.Outbox.publish({
      event: this.engine.Builder.setProfile($profile),
      relays: this.getRelayUrls("write"),
    })

  setPetnames = async ($petnames: string[][]) => {
    if (this.engine.Keys.canSign.get()) {
      await this.engine.Outbox.publish({
        event: this.engine.Builder.setPetnames($petnames),
        relays: this.getRelayUrls("write"),
      })
    } else {
      this.engine.Nip02.graph.key(this.engine.Keys.stateKey.get()).merge({
        updated_at: now(),
        petnames_updated_at: now(),
        petnames: $petnames,
      })
    }
  }

  follow = (pubkey: string) =>
    this.setPetnames(
      this.getPetnames()
        .filter(t => t[1] !== pubkey)
        .concat([this.engine.Builder.mention(pubkey)])
    )

  unfollow = (pubkey: string) =>
    this.setPetnames(reject((t: string[]) => t[1] === pubkey, this.getPetnames()))

  isMuted = (e: Event) => {
    const m = this.getMutesSet()

    return Boolean(find(t => m.has(t), [e.id, e.pubkey, findReplyId(e), findRootId(e)]))
  }

  applyMutes = (events: Event[]) => reject(this.isMuted, events)

  setMutes = async ($mutes: string[][]) => {
    if (this.engine.Keys.canSign.get()) {
      await this.engine.Outbox.publish({
        event: this.engine.Builder.setMutes($mutes.map(t => t.slice(0, 2))),
        relays: this.getRelayUrls("write"),
      })
    } else {
      this.engine.Nip02.graph.key(this.engine.Keys.stateKey.get()).merge({
        updated_at: now(),
        mutes_updated_at: now(),
        mutes: $mutes,
      })
    }
  }

  mute = (type: string, value: string) =>
    this.setMutes(
      reject((t: string[]) => t[1] === value, this.getMutedTags()).concat([[type, value]])
    )

  unmute = (target: string) =>
    this.setMutes(reject((t: string[]) => t[1] === target, this.getMutedTags()))

  // Lists

  getLists = (f?: (l: List) => boolean) =>
    this.engine.Content.getLists(
      l => l.pubkey === this.engine.Keys.stateKey.get() && (f ? f(l) : true)
    )

  putList = (name: string, params: string[][], relays: string[]) =>
    this.engine.Outbox.publish({
      event: this.engine.Builder.createList([["d", name]].concat(params).concat(relays)),
      relays: this.getRelayUrls("write"),
    })

  removeList = (naddr: string) =>
    this.engine.Outbox.publish({
      event: this.engine.Builder.deleteNaddrs([naddr]),
      relays: this.getRelayUrls("write"),
    })

  // Messages

  markAllMessagesRead = () => {
    const lastChecked = fromPairs(
      uniq(pluck("contact", this.engine.Nip04.messages.get())).map(k => [k, now()])
    )

    return this.setAppData(appDataKeys.NIP04_LAST_CHECKED, lastChecked)
  }

  setContactLastChecked = (pubkey: string) => {
    const lastChecked = fromPairs(
      this.engine.Nip04.contacts
        .get()
        .filter(prop("last_checked"))
        .map(r => [r.id, r.last_checked])
    )

    return this.setAppData(appDataKeys.NIP04_LAST_CHECKED, {...lastChecked, [pubkey]: now()})
  }

  setNip24ChannelLastChecked = (channelId: string) => {
    const lastChecked = fromPairs(
      this.engine.Nip24.channels
        .get()
        .filter(prop("last_checked"))
        .map(r => [r.id, r.last_checked])
    )

    return this.setAppData(appDataKeys.NIP24_LAST_CHECKED, {...lastChecked, [channelId]: now()})
  }

  // Channels

  setChannelLastChecked = (id: string) => {
    const lastChecked = fromPairs(
      this.engine.Nip28.channels
        .get()
        .filter(prop("last_checked"))
        .map(r => [r.id, r.last_checked])
    )

    return this.setAppData(appDataKeys.NIP28_LAST_CHECKED, {...lastChecked, [id]: now()})
  }

  saveChannels = () =>
    this.setAppData(
      appDataKeys.NIP28_ROOMS_JOINED,
      pluck("id", this.engine.Nip28.channels.get().filter(whereEq({joined: true})))
    )

  joinChannel = (id: string) => {
    this.engine.Nip28.channels.key(id).merge({joined: true})

    return this.saveChannels()
  }

  leaveChannel = (id: string) => {
    this.engine.Nip28.channels.key(id).merge({joined: false})

    return this.saveChannels()
  }
}
