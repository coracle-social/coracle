import {nth, when, whereEq, reject} from "ramda"
import {now} from "src/util/misc"
import {appDataKeys, normalizeRelayUrl} from "src/util/nostr"
import {derived} from "src/engine/util/store"
import type {Readable} from "src/engine/util/store"
import type {RelayPolicyEntry} from "src/engine/types"
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
}
