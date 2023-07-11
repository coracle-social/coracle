import {
  nip19,
  nip04,
  getPublicKey,
  getSignature,
  getEventHash,
  generatePrivateKey,
} from "nostr-tools"
import NDK, {NDKEvent, NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"
import {
  when,
  uniq,
  pluck,
  without,
  fromPairs,
  whereEq,
  find,
  slice,
  assoc,
  reject,
  prop,
} from "ramda"
import {switcherFn, doPipe} from "hurdak/lib/hurdak"
import {derived} from "svelte/store"
import {now, tryJson, tryFunc, sleep, getter} from "src/util/misc"
import {Tags, normalizeRelayUrl, findReplyId, findRootId} from "src/util/nostr"
import type {System} from "src/system/System"
import type {UserSettings, KeyState} from "src/system/types"
import type {Writable, Readable} from "svelte/store"

const getExtension = () => (window as {nostr?: any}).nostr

let extensionLock = Promise.resolve()

const withExtensionLock = f => {
  extensionLock = extensionLock.then(f)

  return extensionLock
}

export class Crypt {
  keys: Keys
  constructor(keys) {
    this.keys = keys
  }

  async encrypt(pubkey, message) {
    const {method, privkey} = this.keys.getState()

    return switcherFn(method, {
      extension: extension =>
        withExtensionLock(() => {
          return getExtension().nip04.encrypt(pubkey, message)
        }),
      privkey: extension => nip04.encrypt(privkey, pubkey, message),
      bunker: async () => {
        const ndk = await this.keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.encrypt(user, message)
      },
    })
  }

  async decrypt(pubkey, message) {
    const {method, privkey} = this.keys.getState()

    return switcherFn(method, {
      extension: () =>
        withExtensionLock(() => {
          return new Promise(async resolve => {
            let result

            // Alby gives us a bunch of bogus errors, try multiple times
            for (let i = 0; i < 3; i++) {
              result = await tryFunc(() => getExtension().nip04.decrypt(pubkey, message))

              if (result) {
                break
              }

              await sleep(30)
            }

            resolve(result || `<Failed to decrypt message>`)
          })
        }),
      privkey: () => {
        return (
          tryFunc(() => nip04.decrypt(privkey, pubkey, message)) || `<Failed to decrypt message>`
        )
      },
      bunker: async () => {
        const ndk = await this.keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.decrypt(user, message)
      },
    })
  }

  async encryptJson(data) {
    const {pubkey} = this.keys.getState()

    return this.encrypt(pubkey, JSON.stringify(data))
  }

  async decryptJson(data) {
    const {pubkey} = this.keys.getState()

    return tryJson(async () => JSON.parse(await this.decrypt(pubkey, data)))
  }
}

export class Keys {
  keyState: Writable<KeyState>
  getState: () => KeyState
  pubkey: Readable<string>
  canSign: Readable<boolean>
  ndk: NDK

  constructor(sync) {
    this.keyState = sync.store("keys", {})
    this.getState = getter(this.keyState)
    this.pubkey = derived(this.keyState, prop("pubkey"))
    this.canSign = derived(this.keyState, ({method}) =>
      ["bunker", "privkey", "extension"].includes(method)
    )
    this.ndk = null
  }

  getPubkey = () => this.getState().pubkey

  isKeyValid = key => {
    // Validate the key before setting it to state by encoding it using bech32.
    // This will error if invalid (this works whether it's a public or a private key)
    try {
      nip19.npubEncode(key)
    } catch (e) {
      return false
    }

    return true
  }

  prepareNdk = async (token?: string) => {
    const {pubkey, bunkerKey} = this.getState()
    const localSigner = new NDKPrivateKeySigner(bunkerKey)

    this.ndk = new NDK({
      explicitRelayUrls: [
        "wss://relay.f7z.io",
        "wss://relay.damus.io",
        "wss://relay.nsecbunker.com",
      ],
    })

    this.ndk.signer = Object.assign(new NDKNip46Signer(this.ndk, pubkey, localSigner), {token})

    await this.ndk.connect(5000)
    await this.ndk.signer.blockUntilReady()
  }

  getNDK = async () => {
    if (!this.ndk) {
      await this.prepareNdk()
    }

    return this.ndk
  }

  login = (method, key) => {
    this.keyState.update($state => {
      let pubkey = null
      let privkey = null
      let bunkerKey = null

      if (method === "privkey") {
        privkey = key
        pubkey = getPublicKey(key)
      } else if (["pubkey", "extension"].includes(method)) {
        pubkey = key
      } else if (method === "bunker") {
        pubkey = key.pubkey
        bunkerKey = generatePrivateKey()

        this.prepareNdk(key.token)
      }

      return {method, pubkey, privkey, bunkerKey}
    })
  }

  clear = () => {
    this.keyState.set({})
  }

  sign = async event => {
    const {method, privkey} = this.getState()

    console.assert(event.id)
    console.assert(event.pubkey)
    console.assert(event.created_at)

    return switcherFn(method, {
      bunker: async () => {
        const ndkEvent = new NDKEvent(await this.getNDK(), event)

        await ndkEvent.sign(this.ndk.signer)

        return ndkEvent.rawEvent()
      },
      privkey: () => {
        return Object.assign(event, {
          sig: getSignature(event, privkey),
        })
      },
      extension: () =>
        withExtensionLock(() => {
          return getExtension().signEvent(event)
        }),
    })
  }
}

export class User {
  keys: Keys
  crypt: Crypt
  system: System
  canSign: () => boolean
  settings: Writable<UserSettings>
  getSettings: () => UserSettings

  constructor(system) {
    this.system = system
    this.keys = new Keys(system.sync)
    this.crypt = new Crypt(this.keys)
    this.canSign = getter(this.keys.canSign)

    this.settings = system.sync.store("settings/settings", {
      last_updated: 0,
      relay_limit: 10,
      default_zap: 21,
      show_media: true,
      report_analytics: true,
      dufflepud_url: system.env.DUFFLEPUD_URL,
      multiplextr_url: system.env.MULTIPLEXTR_URL,
    })

    this.getSettings = getter(this.settings)

    system.sync.addHandler(30078, async e => {
      if (
        Tags.from(e).getMeta("d") === "coracle/settings/v1" &&
        e.created_at > this.getSetting("last_updated")
      ) {
        const updates = await this.crypt.decryptJson(e.content)

        if (updates) {
          this.settings.set({...this.getSettings(), ...updates, lastUpdated: e.created_at})
        }
      }
    })
  }

  getPubkey = () => this.keys.getState().pubkey

  getProfile = () => this.system.directory.getProfile(this.getPubkey())

  isUserEvent = id => this.system.cache.events.get(id)?.pubkey === this.getPubkey()

  getStateKey = () => (this.canSign() ? this.getPubkey() : "anonymous")

  // Publish

  async prepEvent(rawEvent) {
    return doPipe(rawEvent, [
      assoc("created_at", now()),
      assoc("pubkey", this.getPubkey()),
      e => ({...e, id: getEventHash(e)}),
      this.keys.sign,
    ])
  }

  async publish(event, relays = null, onProgress = null, verb = "EVENT") {
    if (!event.sig) {
      event = await this.prepEvent(event)
    }

    if (!relays) {
      relays = this.getRelayUrls("write")
    }

    // return console.log(event)

    const promise = this.system.network.publish({event, relays, onProgress, verb})

    this.system.sync.processEvents(event)

    return [event, promise]
  }

  // Settings

  getSetting = k => this.getSettings()[k]

  dufflepud = path => `${this.getSetting("dufflepud_url")}/${path}`

  setSettings = async settings => {
    this.settings.update($settings => ({...$settings, ...settings}))

    if (this.canSign()) {
      const d = "coracle/settings/v1"
      const v = await this.crypt.encryptJson(settings)

      return this.publish(this.system.builder.setAppData(d, v))
    }
  }

  async setAppData(key, content) {
    if (this.canSign()) {
      const d = `coracle/${key}`
      const v = await this.crypt.encryptJson(content)

      return this.publish(this.system.builder.setAppData(d, v))
    }
  }

  // Routing

  getRelays = (mode?: string) => this.system.routing.getPubkeyRelays(this.getStateKey(), mode)

  getRelayUrls = (mode?: string) => this.system.routing.getPubkeyRelayUrls(this.getStateKey(), mode)

  setRelays = relays => {
    if (this.canSign()) {
      return this.publish(this.system.builder.setRelays(relays))
    } else {
      this.system.routing.setPolicy({pubkey: this.getStateKey(), created_at: now()}, relays)
    }
  }

  addRelay = url => this.setRelays(this.getRelays().concat({url, read: true, write: true}))

  removeRelay = url =>
    this.setRelays(reject(whereEq({url: normalizeRelayUrl(url)}), this.getRelays()))

  setRelayPolicy = (url, policy) =>
    this.setRelays(this.getRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

  // Social

  getPetnames = () => this.system.social.getPetnames(this.getStateKey())

  getMutedTags = () => this.system.social.getMutedTags(this.getStateKey())

  getFollowsSet = () => this.system.social.getFollowsSet(this.getStateKey())

  getMutesSet = () => this.system.social.getMutesSet(this.getStateKey())

  getFollows = () => this.system.social.getFollows(this.getStateKey())

  getMutes = () => this.system.social.getMutes(this.getStateKey())

  getNetworkSet = () => this.system.social.getNetworkSet(this.getStateKey())

  getNetwork = () => this.system.social.getNetwork(this.getStateKey())

  isFollowing = pubkey => this.system.social.isFollowing(this.getStateKey(), pubkey)

  isIgnoring = pubkeyOrEventId => this.system.social.isIgnoring(this.getStateKey(), pubkeyOrEventId)

  setProfile = $profile => this.publish(this.system.builder.setProfile($profile))

  setPetnames = async $petnames => {
    if (this.canSign()) {
      await this.publish(this.system.builder.setPetnames($petnames))
    } else {
      this.system.social.graph.patch({
        pubkey: this.getStateKey(),
        updated_at: now(),
        petnames_updated_at: now(),
        petnames: $petnames,
      })
    }
  }

  follow = pubkey =>
    this.setPetnames(
      this.getPetnames()
        .filter(t => t[1] !== pubkey)
        .concat([this.system.builder.mention(pubkey)])
    )

  unfollow = pubkey => this.setPetnames(reject(t => t[1] === pubkey, this.getPetnames()))

  isMuted = e => {
    const m = this.getMutesSet()

    return find(t => m.has(t), [e.id, e.pubkey, findReplyId(e), findRootId(e)])
  }

  applyMutes = events => reject(this.isMuted, events)

  setMutes = async $mutes => {
    if (this.canSign()) {
      await this.publish(this.system.builder.setMutes($mutes.map(slice(0, 2))))
    } else {
      this.system.social.graph.patch({
        pubkey: this.getStateKey(),
        updated_at: now(),
        mutes_updated_at: now(),
        mutes: $mutes,
      })
    }
  }

  mute = (type, value) =>
    this.setMutes(reject(t => t[1] === value, this.getMutes()).concat([[type, value]]))

  unmute = target => this.setMutes(reject(t => t[1] === target, this.getMutes()))

  // Content

  getLists = (spec = null) => this.system.content.getLists({...spec, pubkey: this.getStateKey()})

  putList = (name, params, relays) =>
    this.publish(this.system.builder.createList([["d", name]].concat(params).concat(relays)))

  removeList = naddr => this.publish(this.system.builder.deleteNaddrs([naddr]))

  // Chat

  setLastChecked = (channelId, timestamp) => {
    const lastChecked = fromPairs(
      this.system.chat.channels
        .all({last_checked: {$type: "number"}})
        .map(r => [r.id, r.last_checked])
    )

    return this.setAppData("last_checked/v1", {...lastChecked, [channelId]: timestamp})
  }

  joinChannel = channelId => {
    const channelIds = uniq(
      pluck("id", this.system.chat.channels.all({joined: true})).concat(channelId)
    )

    return this.setAppData("rooms_joined/v1", channelIds)
  }

  leaveChannel = channelId => {
    const channelIds = without(
      [channelId],
      pluck("id", this.system.chat.channels.all({joined: true}))
    )

    return this.setAppData("rooms_joined/v1", channelIds)
  }
}
