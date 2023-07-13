import {when, prop, uniq, pluck, without, fromPairs, whereEq, find, slice, reject} from "ramda"
import {now} from "src/util/misc"
import {Tags, appDataKeys, normalizeRelayUrl, findReplyId, findRootId} from "src/util/nostr"
import {writable} from "../util/store"

export class User {
  static contributeState({Env}) {
    const settings = writable<any>({
      last_updated: 0,
      relay_limit: 10,
      default_zap: 21,
      show_media: true,
      report_analytics: true,
      dufflepud_url: Env.DUFFLEPUD_URL,
      multiplextr_url: Env.MULTIPLEXTR_URL,
    })

    return {settings}
  }

  static contributeActions({
    Builder,
    Content,
    Crypt,
    Directory,
    Events,
    Keys,
    Network,
    Outbox,
    Nip02,
    Nip04,
    Nip28,
    Nip65,
    User,
  }) {
    const getPubkey = () => Keys.pubkey.get()

    const getStateKey = () => (Keys.canSign.get() ? getPubkey() : "anonymous")

    // Settings

    const getSetting = k => User.settings.get()[k]

    const dufflepud = path => `${getSetting("dufflepud_url")}/${path}`

    const setSettings = async settings => {
      User.settings.update($settings => ({...$settings, ...settings}))

      if (Keys.canSign.get()) {
        const d = appDataKeys.USER_SETTINGS
        const v = await Crypt.encryptJson(settings)

        return Outbox.queue.push({event: Builder.setAppData(d, v)})
      }
    }

    const setAppData = async (d, content) => {
      const v = await Crypt.encryptJson(content)

      return Outbox.queue.push({event: Builder.setAppData(d, v)})
    }

    // Nip65

    const getRelays = (mode?: string) => Nip65.getPubkeyRelays(getStateKey(), mode)

    const getRelayUrls = (mode?: string) => Nip65.getPubkeyRelayUrls(getStateKey(), mode)

    const setRelays = relays => {
      if (Keys.canSign.get()) {
        return Outbox.queue.push({event: Builder.setRelays(relays)})
      } else {
        Nip65.setPolicy({pubkey: getStateKey(), created_at: now()}, relays)
      }
    }

    const addRelay = url => setRelays(getRelays().concat({url, read: true, write: true}))

    const removeRelay = url =>
      setRelays(reject(whereEq({url: normalizeRelayUrl(url)}), getRelays()))

    const setRelayPolicy = (url, policy) =>
      setRelays(getRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

    // Nip02

    const getPetnames = () => Nip02.getPetnames(getStateKey())

    const getMutedTags = () => Nip02.getMutedTags(getStateKey())

    const getFollowsSet = () => Nip02.getFollowsSet(getStateKey())

    const getMutesSet = () => Nip02.getMutesSet(getStateKey())

    const getFollows = () => Nip02.getFollows(getStateKey())

    const getMutes = () => Nip02.getMutes(getStateKey())

    const getNetworkSet = () => Nip02.getNetworkSet(getStateKey())

    const getNetwork = () => Nip02.getNetwork(getStateKey())

    const isFollowing = pubkey => Nip02.isFollowing(getStateKey(), pubkey)

    const isIgnoring = pubkeyOrEventId => Nip02.isIgnoring(getStateKey(), pubkeyOrEventId)

    const setProfile = $profile => Outbox.queue.push({event: Builder.setProfile($profile)})

    const setPetnames = async $petnames => {
      if (Keys.canSign.get()) {
        await Outbox.queue.push({event: Builder.setPetnames($petnames)})
      } else {
        Nip02.graph.mergeKey(getStateKey(), {
          pubkey: getStateKey(),
          updated_at: now(),
          petnames_updated_at: now(),
          petnames: $petnames,
        })
      }
    }

    const follow = pubkey =>
      setPetnames(
        getPetnames()
          .filter(t => t[1] !== pubkey)
          .concat([Builder.mention(pubkey)])
      )

    const unfollow = pubkey => setPetnames(reject(t => t[1] === pubkey, getPetnames()))

    const isMuted = e => {
      const m = getMutesSet()

      return find(t => m.has(t), [e.id, e.pubkey, findReplyId(e), findRootId(e)])
    }

    const applyMutes = events => reject(isMuted, events)

    const setMutes = async $mutes => {
      if (Keys.canSign.get()) {
        await Outbox.queue.push({event: Builder.setMutes($mutes.map(slice(0, 2)))})
      } else {
        Nip02.graph.mergeKey(getStateKey(), {
          pubkey: getStateKey(),
          updated_at: now(),
          mutes_updated_at: now(),
          mutes: $mutes,
        })
      }
    }

    const mute = (type, value) =>
      setMutes(reject(t => t[1] === value, getMutes()).concat([[type, value]]))

    const unmute = target => setMutes(reject(t => t[1] === target, getMutes()))

    // Content

    const getLists = f => Content.getLists(l => l.pubkey === getStateKey() && (f ? f(l) : true))

    const putList = (name, params, relays) =>
      Outbox.queue.push({
        event: Builder.createList([["d", name]].concat(params).concat(relays)),
      })

    const removeList = naddr => Outbox.queue.push({event: Builder.deleteNaddrs([naddr])})

    // Messages

    const markAllMessagesRead = () => {
      const lastChecked = fromPairs(
        uniq(pluck("contact", Nip04.messages.get())).map(k => [k, now()])
      )

      return setAppData(appDataKeys.NIP04_LAST_CHECKED, lastChecked)
    }

    const setContactLastChecked = pubkey => {
      const lastChecked = fromPairs(
        Nip04.contacts
          .get()
          .filter(prop("last_checked"))
          .map(r => [r.id, r.last_checked])
      )

      return setAppData(appDataKeys.NIP04_LAST_CHECKED, {...lastChecked, [pubkey]: now()})
    }

    // Nip28

    const setChannelLastChecked = id => {
      const lastChecked = fromPairs(
        Nip28.channels
          .get()
          .filter(prop("last_checked"))
          .map(r => [r.id, r.last_checked])
      )

      return setAppData(appDataKeys.NIP28_LAST_CHECKED, {...lastChecked, [id]: now()})
    }

    const joinChannel = channelId => {
      const channelIds = uniq(
        pluck("id", Nip28.channels.get().filter(whereEq({joined: true}))).concat(channelId)
      )

      return setAppData(appDataKeys.NIP28_ROOMS_JOINED, channelIds)
    }

    const leaveChannel = channelId => {
      const channelIds = without(
        [channelId],
        pluck("id", Nip28.channels.get().filter(whereEq({joined: true})))
      )

      return setAppData(appDataKeys.NIP28_ROOMS_JOINED, channelIds)
    }

    return {
      getPubkey,
      getStateKey,
      getSetting,
      dufflepud,
      setSettings,
      getRelays,
      getRelayUrls,
      setRelays,
      addRelay,
      removeRelay,
      setRelayPolicy,
      getPetnames,
      getMutedTags,
      getFollowsSet,
      getMutesSet,
      getFollows,
      getMutes,
      getNetworkSet,
      getNetwork,
      isFollowing,
      isIgnoring,
      setProfile,
      setPetnames,
      follow,
      unfollow,
      isMuted,
      applyMutes,
      setMutes,
      mute,
      unmute,
      getLists,
      putList,
      removeList,
      markAllMessagesRead,
      setContactLastChecked,
      setChannelLastChecked,
      joinChannel,
      leaveChannel,
    }
  }

  static initialize({Events, Crypt, User}) {
    Events.addHandler(30078, async e => {
      if (
        Tags.from(e).getMeta("d") === "coracle/settings/v1" &&
        e.created_at > User.getSetting("last_updated")
      ) {
        const updates = await Crypt.decryptJson(e.content)

        if (updates) {
          User.settings.update($settings => ({
            ...$settings,
            ...updates,
            last_updated: e.created_at,
          }))
        }
      }
    })
  }
}
