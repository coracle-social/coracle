import type {Session} from "@welshman/app"
import {
  follow as baseFollow,
  unfollow as baseUnfollow,
  ensurePlaintext,
  getRelayUrls,
  inboxRelaySelectionsByPubkey,
  nip46Perms,
  pubkey,
  repository,
  session,
  sessions,
  signer,
  tagPubkey,
  userInboxRelaySelections,
  userRelaySelections,
} from "@welshman/app"
import {
  append,
  cached,
  ctx,
  equals,
  first,
  groupBy,
  indexBy,
  last,
  now,
  nthEq,
  nthNe,
  remove,
  splitAt,
} from "@welshman/lib"
import type {Nip46Handler} from "@welshman/signer"
import {Nip01Signer, Nip46Broker, Nip59, makeSecret} from "@welshman/signer"
import type {Profile, TrustedEvent} from "@welshman/util"
import {
  Address,
  DIRECT_MESSAGE,
  FEEDS,
  FOLLOWS,
  INBOX_RELAYS,
  LOCAL_RELAY_URL,
  PROFILE,
  RELAYS,
  SEEN_CONVERSATION,
  Tags,
  addToListPublicly,
  createEvent,
  createProfile,
  editProfile,
  getAddress,
  isPublishedProfile,
  isSignedEvent,
  makeList,
  normalizeRelayUrl,
  removeFromList,
} from "@welshman/util"
import crypto from "crypto"
import {Fetch, seconds, sleep, tryFunc} from "hurdak"
import {assoc, flatten, identity, omit, prop, reject, uniq, without} from "ramda"
import {
  addClientTags,
  anonymous,
  channels,
  createAndPublish,
  getChannelIdFromEvent,
  getChannelSeenKey,
  getClientTags,
  hasNip44,
  publish,
  sign,
  userFeedFavorites,
  userSeenStatusEvents,
  withIndexers,
} from "src/engine/state"
import {sortEventsDesc} from "src/engine/utils"
import {blobToFile, stripExifData} from "src/util/html"
import {joinPath, parseJson} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {get} from "svelte/store"

// Helpers

export const updateRecord = (record, timestamp, updates) => {
  for (const [field, value] of Object.entries(updates)) {
    const tsField = `${field}_updated_at`
    const lastUpdated = record?.[tsField] || -1

    if (timestamp > lastUpdated) {
      record = {
        ...record,
        [field]: value,
        [tsField]: timestamp,
        updated_at: Math.max(timestamp, record?.updated_at || 0),
      }
    }
  }

  return record
}

export const updateStore = (store, timestamp, updates) =>
  store.set(updateRecord(store.get(), timestamp, updates))

export const nip44EncryptToSelf = (payload: string) =>
  signer.get().nip44.encrypt(pubkey.get(), payload)

// Files

export const nip98Fetch = async (url, method, body = null) => {
  const tags = [
    ["u", url],
    ["method", method],
  ]

  if (body) {
    tags.push(["payload", crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")])
  }

  const $signer = signer.get() || Nip01Signer.ephemeral()
  const event = await $signer.sign(createEvent(27235, {tags}))
  const auth = btoa(JSON.stringify(event))
  const headers = {Authorization: `Nostr ${auth}`}

  return Fetch.fetchJson(url, {body, method, headers})
}

export const getMediaProviderURL = cached({
  maxSize: 10,
  getKey: ([url]) => url,
  getValue: ([url]) => fetchMediaProviderURL(url),
})

const fetchMediaProviderURL = async host =>
  prop("api_url", await Fetch.fetchJson(joinPath(host, ".well-known/nostr/nip96.json")))

const fileToFormData = file => {
  const formData = new FormData()

  formData.append("file[]", file)

  return formData
}

export const uploadFileToHost = async (url, file) => {
  const startTime = now()
  const apiUrl = await getMediaProviderURL(url)
  const response = await nip98Fetch(apiUrl, "POST", fileToFormData(file))

  // If the media provider uses delayed processing, we need to wait for the processing to be done
  while (response.processing_url) {
    const {status, nip94_event} = await nip98Fetch(response.processing_url, "GET")

    if (status === "success") {
      return nip94_event
    }

    if (now() - startTime > 60) {
      break
    }

    await sleep(3000)
  }

  return response.nip94_event
}

export const uploadFilesToHost = (url, files) =>
  Promise.all(files.map(file => tryFunc(async () => await uploadFileToHost(url, file))))

export const uploadFileToHosts = (urls, file) =>
  Promise.all(urls.map(url => tryFunc(async () => await uploadFileToHost(url, file))))

export const uploadFilesToHosts = async (urls, files) =>
  flatten(await Promise.all(urls.map(url => uploadFilesToHost(url, files)))).filter(identity)

export const compressFiles = (files, opts) =>
  Promise.all(
    files.map(async f => {
      if (f.type.match("image/(webp|gif)")) {
        return f
      }

      return blobToFile(await stripExifData(f, opts))
    }),
  )

export const eventsToMeta = (events: TrustedEvent[]) => {
  const tagsByHash = groupBy((tags: Tags) => tags.get("ox").value(), events.map(Tags.fromEvent))

  // Merge all nip94 tags together so we can supply as much imeta as possible
  return Array.from(tagsByHash.values()).map(groupedTags => {
    return Tags.wrap(groupedTags.flatMap(tags => tags.unwrap())).uniq()
  })
}

export const uploadFiles = async (urls, files, compressorOpts = {}) => {
  const compressedFiles = await compressFiles(files, compressorOpts)
  const nip94Events = await uploadFilesToHosts(urls, compressedFiles)

  return eventsToMeta(nip94Events)
}

// Key state management

export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = ctx.app.router.PublishEvent(event).getUrls()

  return await publish({event, relays})
}

// Deletes

export const publishDeletion = ({kind, address = null, id = null}) => {
  const tags = [["k", String(kind)]]

  if (address) {
    tags.push(["a", address])
  }

  if (id) {
    tags.push(["e", id])
  }

  return createAndPublish({
    tags,
    kind: 5,
    relays: ctx.app.router.FromUser().getUrls(),
    forcePlatform: false,
  })
}

export const deleteEvent = (event: TrustedEvent) =>
  publishDeletion({id: event.id, address: getAddress(event), kind: event.kind})

export const deleteEventByAddress = (address: string) =>
  publishDeletion({address, kind: Address.from(address).kind})

// Profile

export const publishProfile = (profile: Profile, {forcePlatform = false} = {}) => {
  const relays = withIndexers(ctx.app.router.FromUser().getUrls())
  const template = isPublishedProfile(profile) ? editProfile(profile) : createProfile(profile)

  return createAndPublish({...addClientTags(template), relays, forcePlatform})
}

// Follows

export const unfollow = async (value: string) =>
  signer.get()
    ? baseUnfollow(value)
    : anonymous.update($a => ({...$a, follows: reject(nthEq(1, value), $a.follows)}))

export const follow = async (tag: string[]) =>
  signer.get()
    ? baseFollow(tag)
    : anonymous.update($a => ({...$a, follows: append(tag, $a.follows)}))

// Feed favorites

export const removeFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})
  const template = await removeFromList(list, address).reconcile(nip44EncryptToSelf)

  return createAndPublish({...template, relays: ctx.app.router.FromUser().getUrls()})
}

export const addFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})
  const template = await addToListPublicly(list, ["a", address]).reconcile(nip44EncryptToSelf)

  return createAndPublish({...template, relays: ctx.app.router.FromUser().getUrls()})
}

// Relays

export const requestRelayAccess = async (url: string, claim: string) =>
  createAndPublish({
    kind: 28934,
    forcePlatform: false,
    tags: [["claim", claim]],
    relays: [url],
  })

export const setOutboxPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  if (signer.get()) {
    const list = get(userRelaySelections) || makeList({kind: RELAYS})

    createAndPublish({
      kind: list.kind,
      content: list.event?.content || "",
      tags: modifyTags(list.publicTags),
      relays: withIndexers(ctx.app.router.FromUser().getUrls()),
    })
  } else {
    anonymous.update($a => ({...$a, relays: modifyTags($a.relays)}))
  }
}

export const setInboxPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  const list = get(userInboxRelaySelections) || makeList({kind: INBOX_RELAYS})

  createAndPublish({
    kind: list.kind,
    content: list.event?.content || "",
    tags: modifyTags(list.publicTags),
    relays: withIndexers(ctx.app.router.FromUser().getUrls()),
  })
}

export const setInboxPolicy = (url: string, enabled: boolean) => {
  const urls = getRelayUrls(inboxRelaySelectionsByPubkey.get().get(pubkey.get()))

  // Only update inbox policies if they already exist or we're adding them
  if (enabled || urls.includes(url)) {
    setInboxPolicies($tags => {
      $tags = $tags.filter(t => normalizeRelayUrl(t[1]) !== url)

      if (enabled) {
        $tags.push(["relay", url])
      }

      return $tags
    })
  }
}

export const setOutboxPolicy = (url: string, read: boolean, write: boolean) =>
  setOutboxPolicies($tags => {
    $tags = $tags.filter(t => normalizeRelayUrl(t[1]) !== url)

    if (read && write) {
      $tags.push(["r", url])
    } else if (read) {
      $tags.push(["r", url, "read"])
    } else if (write) {
      $tags.push(["r", url, "write"])
    }

    return $tags
  })

export const leaveRelay = async (url: string) => {
  await Promise.all([setInboxPolicy(url, false), setOutboxPolicy(url, false, false)])

  // Make sure the new relay selections get to the old relay
  if (pubkey.get()) {
    broadcastUserData([url])
  }
}

export const joinRelay = async (url: string, claim?: string) => {
  url = normalizeRelayUrl(url)

  if (claim && signer.get()) {
    await requestRelayAccess(url, claim)
  }

  await setOutboxPolicy(url, true, true)

  // Re-publish user meta to the new relay
  if (pubkey.get()) {
    broadcastUserData([url])
  }
}

// Read receipts

export const markAsSeen = async (kind: number, eventsByKey: Record<string, TrustedEvent[]>) => {
  if (!get(hasNip44) || Object.entries(eventsByKey).length === 0) {
    return
  }

  const cutoff = now() - seconds(180, "day")
  const prev = get(userSeenStatusEvents).find(e => e.kind === kind)
  const prevTags = prev ? parseJson(await ensurePlaintext(prev))?.filter?.(nthNe(1, "*")) : []
  const data = indexBy(t => t[1], prevTags || [])

  for (const [key, events] of Object.entries(eventsByKey)) {
    if (events.length === 0) {
      continue
    }

    const [newer, older] = splitAt(1, sortEventsDesc(events))
    const ts = first(older)?.created_at || last(newer).created_at - seconds(3, "hour")

    if (ts >= cutoff) {
      data.set(key, ["seen", key, String(ts), ...newer.map(e => e.id)])
    } else {
      data.delete(key)
    }
  }

  const tags = Array.from(data.values())

  if (equals(tags, prevTags)) {
    return
  }

  // Wait until after comparing for equality to add our current timestamp
  const json = JSON.stringify([...tags, ["seen", "*", String(cutoff)]])
  // const relays = ctx.app.router.FromUser().getUrls()
  const content = await signer.get().nip44.encrypt(pubkey.get(), json)

  await createAndPublish({kind, content, relays: [LOCAL_RELAY_URL]})
}

// Messages

export const sendLegacyMessage = async (channelId: string, content: string) => {
  const $pubkey = pubkey.get()
  const recipients = without([$pubkey], channelId.split(","))

  if (recipients.length > 1) {
    throw new Error("Attempted to send legacy message to more than 1 recipient")
  }

  const recipient = recipients[0] || $pubkey

  return createAndPublish({
    kind: 4,
    tags: [tagPubkey(recipient), ...getClientTags()],
    content: await signer.get().nip04.encrypt(recipient, content),
    relays: ctx.app.router.PubkeyInbox(recipient).getUrls(),
    forcePlatform: false,
  })
}

export const sendMessage = async (channelId: string, content: string) => {
  const recipients = channelId.split(",")
  const template = {
    content,
    kind: 14,
    created_at: now(),
    tags: [...remove(pubkey.get(), recipients).map(tagPubkey), ...getClientTags()],
  }

  for (const recipient of uniq(recipients.concat(pubkey.get()))) {
    const helper = Nip59.fromSigner(signer.get())
    const rumor = await helper.wrap(recipient, template)

    await publish({
      event: rumor.wrap,
      relays: ctx.app.router.PubkeyInbox(recipient).getUrls(),
      forcePlatform: false,
    })
  }
}

export const markChannelsRead = (ids: Set<string>) => {
  const $pubkey = pubkey.get()
  const eventsByKey = {}

  for (const {id, last_sent = 0, last_received = 0, last_checked = 0} of get(channels)) {
    if (!ids.has(id) || Math.max(last_sent, last_checked) > last_received) {
      continue
    }

    const members = id.split(",")
    const key = getChannelSeenKey(id)
    const since = Math.max(last_sent, last_checked)
    const events = repository
      .query([{kinds: [4, DIRECT_MESSAGE], authors: members, "#p": members, since}])
      .filter(e => getChannelIdFromEvent(e) === id && e.pubkey !== $pubkey)

    if (events.length > 0) {
      eventsByKey[key] = events
    }
  }

  markAsSeen(SEEN_CONVERSATION, eventsByKey)
}

export const markAllChannelsRead = () => markChannelsRead(new Set(get(channels).map(c => c.id)))

export const markChannelRead = (id: string) => markChannelsRead(new Set([id]))

// Session/login

const addSession = (s: Session) => {
  sessions.update(assoc(s.pubkey, s))
  pubkey.set(s.pubkey)
}

export const loginWithPublicKey = pubkey => addSession({method: "pubkey", pubkey})

export const loginWithNip07 = pubkey => addSession({method: "nip07", pubkey})

export const loginWithNip55 = (pubkey, pkg) =>
  addSession({method: "nip55", pubkey: pubkey, signer: pkg})

export const loginWithNip46 = async (token: string, handler: Nip46Handler) => {
  const secret = makeSecret()
  const broker = Nip46Broker.get({secret, handler})
  const result = await broker.connect(token, nip46Perms)

  if (!result) return false

  const pubkey = await broker.getPublicKey()

  if (!pubkey) return false

  addSession({method: "nip46", pubkey, secret, handler})

  return true
}

export const logoutPubkey = pubkey => {
  if (session.get().pubkey === pubkey) {
    throw new Error("Can't destroy the current session, use logout instead")
  }

  sessions.update(omit([pubkey]))
}

export const logout = () => {
  pubkey.set(null)
  sessions.set({})
}

export const setAppData = async (d: string, data: any) => {
  if (signer.get()) {
    const {pubkey} = session.get()

    return createAndPublish({
      kind: 30078,
      tags: [["d", d]],
      content: await signer.get().nip04.encrypt(pubkey, JSON.stringify(data)),
      relays: ctx.app.router.FromUser().getUrls(),
      forcePlatform: false,
    })
  }
}

export const publishSettings = ($settings: Record<string, any>) =>
  setAppData(appDataKeys.USER_SETTINGS, $settings)

export const broadcastUserData = async (relays: string[]) => {
  const authors = [pubkey.get()]
  const kinds = [RELAYS, INBOX_RELAYS, FOLLOWS, PROFILE]
  const events = repository.query([{kinds, authors}])

  for (const event of events) {
    if (isSignedEvent(event)) {
      await publish({event, relays, forcePlatform: false})
    }
  }
}
