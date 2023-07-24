import {when, prop, uniq, pluck, fromPairs, whereEq, find, reject} from "ramda"
import {now} from "src/util/misc"
import {Tags, appDataKeys, normalizeRelayUrl, findReplyId, findRootId} from "src/util/nostr"
import type {RelayPolicyEntry, List, Event} from "src/engine/types"
import {writable} from "src/engine/util/store"
import type {Writable} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"

export class User {
  engine: Engine
  settings: Writable<Record<string, any>>

  getStateKey = () => this.engine.Keys.pubkey.get() || "anonymous"

  // Settings

  getSetting = (k: string) => this.settings.get()[k]

  dufflepud = (path: string) => `${this.getSetting("dufflepud_url")}/${path}`

  setSettings = async (settings: Record<string, any>) => {
    this.settings.update($settings => ({...$settings, ...settings}))

    if (this.engine.Keys.canSign.get()) {
      const d = appDataKeys.USER_SETTINGS
      const v = await this.engine.Crypt.encryptJson(settings)

      return this.engine.Outbox.publish(this.engine.Builder.setAppData(d, v))
    }
  }

  setAppData = async (d: string, content: any) => {
    const v = await this.engine.Crypt.encryptJson(content)

    return this.engine.Outbox.publish(this.engine.Builder.setAppData(d, v))
  }

  // Nip65

  getRelays = (mode?: string) => this.engine.Nip65.getPubkeyRelays(this.getStateKey(), mode)

  getRelayUrls = (mode?: string) => this.engine.Nip65.getPubkeyRelayUrls(this.getStateKey(), mode)

  setRelays = (relays: RelayPolicyEntry[]) => {
    if (this.engine.Keys.canSign.get()) {
      return this.engine.Outbox.publish(this.engine.Builder.setRelays(relays))
    } else {
      this.engine.Nip65.setPolicy({pubkey: this.getStateKey(), created_at: now()}, relays)
    }
  }

  addRelay = (url: string) =>
    this.setRelays(this.getRelays().concat({url, read: true, write: true}))

  removeRelay = (url: string) =>
    this.setRelays(reject(whereEq({url: normalizeRelayUrl(url)}), this.getRelays()))

  setRelayPolicy = (url: string, policy: Partial<RelayPolicyEntry>) =>
    this.setRelays(this.getRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

  // Nip02

  getPetnames = () => this.engine.Nip02.getPetnames(this.getStateKey())

  getMutedTags = () => this.engine.Nip02.getMutedTags(this.getStateKey())

  getFollowsSet = () => this.engine.Nip02.getFollowsSet(this.getStateKey())

  getMutesSet = () => this.engine.Nip02.getMutesSet(this.getStateKey())

  getFollows = () => this.engine.Nip02.getFollows(this.getStateKey())

  getMutes = () => this.engine.Nip02.getMutes(this.getStateKey())

  getNetworkSet = () => this.engine.Nip02.getNetworkSet(this.getStateKey())

  getNetwork = () => this.engine.Nip02.getNetwork(this.getStateKey())

  isFollowing = (pubkey: string) => this.engine.Nip02.isFollowing(this.getStateKey(), pubkey)

  isIgnoring = (pubkeyOrEventId: string) =>
    this.engine.Nip02.isIgnoring(this.getStateKey(), pubkeyOrEventId)

  setProfile = ($profile: Record<string, any>) =>
    this.engine.Outbox.publish(this.engine.Builder.setProfile($profile))

  setPetnames = async ($petnames: string[][]) => {
    if (this.engine.Keys.canSign.get()) {
      await this.engine.Outbox.publish(this.engine.Builder.setPetnames($petnames))
    } else {
      this.engine.Nip02.graph.key(this.getStateKey()).merge({
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

    return find(t => m.has(t), [e.id, e.pubkey, findReplyId(e), findRootId(e)])
  }

  applyMutes = (events: Event[]) => reject(this.isMuted, events)

  setMutes = async ($mutes: string[][]) => {
    if (this.engine.Keys.canSign.get()) {
      await this.engine.Outbox.publish(this.engine.Builder.setMutes($mutes.map(t => t.slice(0, 2))))
    } else {
      this.engine.Nip02.graph.key(this.getStateKey()).merge({
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
    this.engine.Content.getLists(l => l.pubkey === this.getStateKey() && (f ? f(l) : true))

  putList = (name: string, params: string[][], relays: string[]) =>
    this.engine.Outbox.publish(
      this.engine.Builder.createList([["d", name]].concat(params).concat(relays))
    )

  removeList = (naddr: string) =>
    this.engine.Outbox.publish(this.engine.Builder.deleteNaddrs([naddr]))

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
    this.engine.Nip28.channels.key(id).merge({joined: false})

    return this.saveChannels()
  }

  leaveChannel = (id: string) => {
    this.engine.Nip28.channels.key(id).merge({joined: false})
    this.engine.Nip28.messages.reject(m => m.channel === id)

    return this.saveChannels()
  }

  initialize(engine: Engine) {
    this.engine = engine

    this.settings = writable<Record<string, any>>({
      last_updated: 0,
      relay_limit: 10,
      default_zap: 21,
      show_media: true,
      report_analytics: true,
      dufflepud_url: engine.Env.DUFFLEPUD_URL,
      multiplextr_url: engine.Env.MULTIPLEXTR_URL,
    })

    engine.Events.addHandler(30078, async e => {
      if (
        Tags.from(e).getMeta("d") === "coracle/settings/v1" &&
        e.created_at > this.getSetting("last_updated")
      ) {
        const updates = await engine.Crypt.decryptJson(e.content)

        if (updates) {
          this.settings.update($settings => ({
            ...$settings,
            ...updates,
            last_updated: e.created_at,
          }))
        }
      }
    })
  }
}
