import {nwc} from "@getalby/sdk"
import {append, first, nthNe, remove, sha256, uniq} from "@welshman/lib"
import {User, publish} from "@welshman/app"
import {Nip01Signer} from "@welshman/signer"
import {AppData, Delete, DirectMessage, Poll, RelayJoin, RelayList} from "@welshman/domain"
import type {RelayListWriter} from "@welshman/domain"
import {
  FOLLOWS,
  MESSAGING_RELAYS,
  PROFILE,
  RELAYS,
  hexTags,
  inboxes,
  isNWCWallet,
  isSignedEvent,
  isWebLNWallet,
  makeBlossomAuthEvent,
  normalizeRelayUrl,
  relay,
  tagValues,
  uploadBlob,
  userOutbox,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {
  app,
  command,
  deletes,
  feedLists,
  followLists,
  messagingRelayLists,
  profiles,
  reader,
  relayLists,
  resolveRelays,
  thunks,
  wraps,
  writer,
} from "src/engine/core"
import {anonymous, getClientTags, sessionWithMeta, sign} from "src/engine/state"
import {PollVote, userListKind} from "src/domain"
import {stripExifData} from "src/util/html"
import {appDataKeys, RELAY_FEEDS} from "src/util/nostr"

// Helpers

const getUserEvent = (kind: number) => {
  const $app = app.get()

  return $app.user
    ? first($app.repository.query([{kinds: [kind], authors: [$app.user.pubkey]}]))
    : undefined
}

// Files

export const uploadFile = async (server: string, file: File, compressorOpts = {}) => {
  if (!file.type.match("image/(webp|gif)")) {
    file = await stripExifData(file, compressorOpts)
  }

  const hashes = [await sha256(await file.arrayBuffer())]
  const $signer = app.get().user?.signer || Nip01Signer.ephemeral()
  const authEvent = await $signer.sign(makeBlossomAuthEvent({action: "upload", server, hashes}))
  const res = await uploadBlob(server, file, {authEvent})

  try {
    return res.json()
  } catch (e) {
    return {error: await res.text()}
  }
}

// Key state management

export const signAndPublish = async (template, {anonymous: asAnonymous = false} = {}) => {
  const event = await sign(template, {anonymous: asAnonymous})

  const relays = await resolveRelays([
    ...(asAnonymous ? [] : [userOutbox()]),
    ...inboxes(tagValues(hexTags("p"), event.tags), 0.5),
  ])

  return thunks.get().publish({event, relays})
}

// Polls

export type PollResponseParams = {
  event: TrustedEvent
  selectedIds: string[]
}

export const publishPollResponse = async ({event, selectedIds}: PollResponseParams) => {
  const eventWriter = writer(PollVote)
    .setPollUrls(reader(Poll)(event).urls())
    .setPollId(event.id)
    .addMention(event.pubkey)
    .addTags(...getClientTags())

  for (const selectedId of selectedIds) {
    eventWriter.addSelection(selectedId)
  }

  return command(eventWriter).then(publish)
}

// Deletes

export const deleteEvent = (event: TrustedEvent) => deletes.get().deleteEvent(event).then(publish)

export type DeletionParams = {
  kind: number
  id?: string
  address?: string
}

export const publishDeletion = async ({kind, id, address}: DeletionParams) => {
  const $repository = app.get().repository
  const event = (id && $repository.getEvent(id)) || (address && $repository.getEvent(address))

  if (event) {
    return deleteEvent(event)
  }

  const eventWriter = writer(Delete).addTags(["k", String(kind)])

  if (id) {
    eventWriter.addTags(["e", id])
  }

  if (address) {
    eventWriter.addTags(["a", address])
  }

  return command(eventWriter).then(publish)
}

// Follows

const makeFollowTag = (pubkey: string) => [
  "p",
  pubkey,
  first(relayLists.get().writeUrls(pubkey).get()) || "",
  profiles.get().display(pubkey).get(),
]

export const follow = async (pubkey: string) => {
  const tag = makeFollowTag(pubkey)

  if (!app.get().user) {
    return anonymous.update($a => ({...$a, follows: append(tag, $a.follows)}))
  }

  // FollowLists.follow appends the tag without deduping, so drop any existing entry first
  return followLists
    .get()
    .update(eventWriter => eventWriter.unfollow(pubkey).addTags(tag))
    .then(publish)
}

export const unfollow = async (value: string) => {
  if (!app.get().user) {
    return anonymous.update($a => ({...$a, follows: $a.follows.filter(nthNe(1, value))}))
  }

  return followLists.get().unfollow(value).then(publish)
}

// Feed favorites

export const addFeedFavorite = async (address: string) =>
  feedLists.get().addFeed(address).then(publish)

export const removeFeedFavorite = async (address: string) =>
  feedLists.get().removeFeed(address).then(publish)

// Relay feeds

export const setRelayFeeds = async (urls: string[]) => {
  const kind = userListKind(RELAY_FEEDS)
  const event = getUserEvent(RELAY_FEEDS)
  const eventWriter = writer(kind, event ? await reader(kind)(event) : undefined)
    .dropPublic(t => ["r", "relay"].includes(t[0]))
    .addPublic(...urls.map(url => ["relay", url]))

  return command(eventWriter).then(publish)
}

// Relays

export const requestRelayAccess = async (url: string, claim: string) =>
  command(writer(RelayJoin).setClaim(claim).forceRoutes(relay(url))).then(publish)

const editRelayList = async (fn: (writer: RelayListWriter) => void) => {
  if (!app.get().user) {
    const eventWriter = writer(RelayList).addTags(...anonymous.get().relays)

    fn(eventWriter)

    return anonymous.update($a => ({...$a, relays: eventWriter.extraTags}))
  }

  return relayLists.get().update(fn).then(publish)
}

export const setOutboxPolicies = (tags: string[][]) =>
  editRelayList(eventWriter => {
    eventWriter.setTags(tags)
  })

export const setOutboxPolicy = (url: string, read: boolean, write: boolean) =>
  editRelayList(eventWriter => {
    if (read) {
      eventWriter.addReadUrl(url)
    } else {
      eventWriter.removeReadUrl(url)
    }

    if (write) {
      eventWriter.addWriteUrl(url)
    } else {
      eventWriter.removeWriteUrl(url)
    }
  })

export const setMessagingPolicy = async (url: string, enabled: boolean) => {
  const $app = app.get()

  if (!$app.user) {
    return
  }

  const $messagingRelayLists = messagingRelayLists.get()
  const urls = $messagingRelayLists.urls($app.user.pubkey).get()

  if (!enabled && !urls.includes(normalizeRelayUrl(url))) {
    return
  }

  return (
    $messagingRelayLists
      // removeUrl first, since addUrl doesn't dedupe
      .update(eventWriter =>
        enabled ? eventWriter.removeUrl(url).addUrl(url) : eventWriter.removeUrl(url),
      )
      .then(publish)
  )
}

export const leaveRelay = async (url: string) => {
  await Promise.all([setMessagingPolicy(url, false), setOutboxPolicy(url, false, false)])

  // Make sure the new relay selections get to the old relay
  if (app.get().user) {
    await broadcastUserData([url])
  }
}

export const joinRelay = async (url: string, claim?: string) => {
  url = normalizeRelayUrl(url)

  if (claim && app.get().user) {
    await requestRelayAccess(url, claim)
  }

  await setOutboxPolicy(url, true, true)

  // Re-publish user meta to the new relay
  if (app.get().user) {
    await broadcastUserData([url])
  }
}

// Messages

export const sendMessage = (channelId: string, content: string, delay: number) => {
  const {pubkey} = User.require(app.get())
  const recipients = uniq(channelId.split(",").concat(pubkey))
  const others = remove(pubkey, recipients)
  const eventWriter = writer(DirectMessage)
    .setContent(content)
    .addTags(...getClientTags())

  for (const recipient of others.length > 0 ? others : [pubkey]) {
    eventWriter.addRecipient(recipient)
  }

  return eventWriter.renderTemplate().then(event => wraps.get().publish({event, recipients, delay}))
}

// Settings

export const setAppData = async (d: string, data: any) => {
  if (!app.get().user) {
    return
  }

  const eventWriter = writer(AppData).setIdentifier(d).setValues(data).setEncrypted(true)

  return command(eventWriter).then(publish)
}

export const publishSettings = ($settings: Record<string, any>) =>
  setAppData(appDataKeys.USER_SETTINGS, $settings)

const broadcast = async (kinds: number[], relays: string[]) => {
  const $app = app.get()

  if (!$app.user || relays.length === 0) {
    return
  }

  for (const event of $app.repository.query([{kinds, authors: [$app.user.pubkey]}])) {
    if (isSignedEvent(event)) {
      thunks.get().publish({event, relays})
    }
  }
}

export const broadcastUserRelays = (relays: string[]) => broadcast([RELAYS], relays)

export const broadcastUserData = (relays: string[]) =>
  broadcast([RELAYS, MESSAGING_RELAYS, FOLLOWS, PROFILE], relays)

// Lightning

export const getWebLn = () => (window as any).webln

export const payInvoice = async (invoice: string) => {
  const wallet = sessionWithMeta.get()?.wallet

  if (!wallet) {
    return alert(invoice)
  }

  if (isNWCWallet(wallet)) {
    return new nwc.NWCClient(wallet.info).payInvoice({invoice})
  } else if (isWebLNWallet(wallet)) {
    return getWebLn()
      .enable()
      .then(() => getWebLn().sendPayment(invoice))
  }
}
