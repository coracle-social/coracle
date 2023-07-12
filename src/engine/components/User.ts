import {getEventHash} from "nostr-tools"
import {when, uniq, pluck, without, fromPairs, whereEq, find, slice, assoc, reject} from "ramda"
import {doPipe} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import {Tags, normalizeRelayUrl, findReplyId, findRootId} from "src/util/nostr"
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
    Keys,
    Directory,
    Events,
    Network,
    Crypt,
    Builder,
    Social,
    Routing,
    User,
    Chat,
    Content,
  }) {
    const getPubkey = () => Keys.pubkey.get()

    const getProfile = () => Directory.getProfile(getPubkey())

    const isUserEvent = id => Events.cache.getKey(id)?.pubkey === getPubkey()

    const getStateKey = () => (Keys.canSign.get() ? getPubkey() : "anonymous")

    // Publish

    const prepEvent = async rawEvent => {
      return doPipe(rawEvent, [
        assoc("created_at", now()),
        assoc("pubkey", getPubkey()),
        e => ({...e, id: getEventHash(e)}),
        Keys.sign,
      ])
    }

    const publish = async (event, relays = null, onProgress = null, verb = "EVENT") => {
      if (!event.sig) {
        event = await prepEvent(event)
      }

      if (!relays) {
        relays = getRelayUrls("write")
      }

      // return console.log(event)

      const promise = Network.publish({event, relays, onProgress, verb})

      Events.queue.push(event)

      return [event, promise]
    }

    // Settings

    const getSetting = k => User.settings.get()[k]

    const dufflepud = path => `${getSetting("dufflepud_url")}/${path}`

    const setSettings = async settings => {
      User.settings.update($settings => ({...$settings, ...settings}))

      if (Keys.canSign.get()) {
        const d = "coracle/settings/v1"
        const v = await Crypt.encryptJson(settings)

        return publish(Builder.setAppData(d, v))
      }
    }

    const setAppData = async (key, content) => {
      if (Keys.canSign.get()) {
        const d = `coracle/${key}`
        const v = await Crypt.encryptJson(content)

        return publish(Builder.setAppData(d, v))
      }
    }

    // Routing

    const getRelays = (mode?: string) => Routing.getPubkeyRelays(getStateKey(), mode)

    const getRelayUrls = (mode?: string) => Routing.getPubkeyRelayUrls(getStateKey(), mode)

    const setRelays = relays => {
      if (Keys.canSign.get()) {
        return publish(Builder.setRelays(relays))
      } else {
        Routing.setPolicy({pubkey: getStateKey(), created_at: now()}, relays)
      }
    }

    const addRelay = url => setRelays(getRelays().concat({url, read: true, write: true}))

    const removeRelay = url =>
      setRelays(reject(whereEq({url: normalizeRelayUrl(url)}), getRelays()))

    const setRelayPolicy = (url, policy) =>
      setRelays(getRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

    // Social

    const getPetnames = () => Social.getPetnames(getStateKey())

    const getMutedTags = () => Social.getMutedTags(getStateKey())

    const getFollowsSet = () => Social.getFollowsSet(getStateKey())

    const getMutesSet = () => Social.getMutesSet(getStateKey())

    const getFollows = () => Social.getFollows(getStateKey())

    const getMutes = () => Social.getMutes(getStateKey())

    const getNetworkSet = () => Social.getNetworkSet(getStateKey())

    const getNetwork = () => Social.getNetwork(getStateKey())

    const isFollowing = pubkey => Social.isFollowing(getStateKey(), pubkey)

    const isIgnoring = pubkeyOrEventId => Social.isIgnoring(getStateKey(), pubkeyOrEventId)

    const setProfile = $profile => publish(Builder.setProfile($profile))

    const setPetnames = async $petnames => {
      if (Keys.canSign.get()) {
        await publish(Builder.setPetnames($petnames))
      } else {
        Social.graph.mergeKey(getStateKey(), {
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
        await publish(Builder.setMutes($mutes.map(slice(0, 2))))
      } else {
        Social.graph.mergeKey(getStateKey(), {
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

    const getLists = (spec = null) => Content.getLists({...spec, pubkey: getStateKey()})

    const putList = (name, params, relays) =>
      publish(Builder.createList([["d", name]].concat(params).concat(relays)))

    const removeList = naddr => publish(Builder.deleteNaddrs([naddr]))

    // Chat

    const setLastChecked = (channelId, timestamp) => {
      const lastChecked = fromPairs(
        Chat.channels.all({last_checked: {$type: "number"}}).map(r => [r.id, r.last_checked])
      )

      return setAppData("last_checked/v1", {...lastChecked, [channelId]: timestamp})
    }

    const joinChannel = channelId => {
      const channelIds = uniq(pluck("id", Chat.channels.all({joined: true})).concat(channelId))

      return setAppData("rooms_joined/v1", channelIds)
    }

    const leaveChannel = channelId => {
      const channelIds = without([channelId], pluck("id", Chat.channels.all({joined: true})))

      return setAppData("rooms_joined/v1", channelIds)
    }

    return {
      getPubkey,

      getProfile,

      isUserEvent,

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
      setLastChecked,
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
