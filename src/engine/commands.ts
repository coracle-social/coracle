import {nwc} from "@getalby/sdk"
import {get} from "svelte/store"
import {append, first, nthNe, remove, sha256, uniq} from "@welshman/lib"
import {User, publish} from "@welshman/app"
import type {Command} from "@welshman/app"
import {Nip01Signer} from "@welshman/signer"
import {
  AppData,
  Delete,
  DirectMessage,
  Poll,
  PollResponse,
  RelayJoin,
  RelayList,
} from "@welshman/domain"
import type {RelayListWriter} from "@welshman/domain"
import {
  FOLLOWS,
  MESSAGING_RELAYS,
  PROFILE,
  RELAYS,
  addMaximalFallbacks,
  addMinimalFallbacks,
  hexTags,
  inboxes,
  isNWCWallet,
  isSignedEvent,
  isWebLNWallet,
  makeBlossomAuthEvent,
  normalizeRelayUrl,
  relays as relaySelections,
  tagValues,
  uploadBlob,
  userOutbox,
} from "@welshman/util"
import type {TrustedEvent, Wallet} from "@welshman/util"
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
  session,
  thunks,
  wraps,
  writer,
} from "src/engine/core"
import {env} from "src/engine/env"
import {anonymous, getClientTags, sign} from "src/engine/state"
import {userListKind} from "src/domain"
import {stripExifData} from "src/util/html"
import {appDataKeys, RELAY_FEEDS} from "src/util/nostr"

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

// A writer resolves its own publish relays at limit 3 with no fallbacks, which sends a brand new
// user's lists nowhere at all. Coracle has always published its own data to the user's write
// relays, topping the selection up with defaults, so re-resolve rather than take what the writer
// worked out.
const userRelays = () => resolveRelays([userOutbox()], {policy: addMaximalFallbacks})

const publishToUserRelays = async (eventCommand: Command) =>
  eventCommand.publishToRelays(await userRelays())

// Relay and messaging relay lists also go to the indexers, which is where other clients look for
// them. Kind 10002 routes itself there; kind 10050 doesn't.
const publishToUserRelaysAndIndexers = async (eventCommand: Command) =>
  eventCommand.publishToRelays(uniq([...(await userRelays()), ...env.INDEXER_RELAYS]))

// The user's own copy of a replaceable kind, read straight from the repository. Welshman keeps an
// index for the kinds it models; coracle's own kinds have to be looked up.
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

  // Deliver to the author's write relays and everyone they mentioned. An anonymous note is signed
  // with a throwaway key which has no relay list, so asking for its outbox would only stall on a
  // load that can't succeed.
  const relays = await resolveRelays(
    [...(asAnonymous ? [] : [userOutbox()]), ...inboxes(tagValues(hexTags("p"), event.tags), 0.5)],
    // Notes carry mentions, so raise the limit to keep them deliverable, and fall back to a
    // default relay only when nothing else resolved
    {limit: 30, policy: addMinimalFallbacks},
  )

  return thunks.get().publish({event, relays})
}

// Polls

export type PollResponseParams = {
  event: TrustedEvent
  selectedIds: string[]
}

export const publishPollResponse = async ({event, selectedIds}: PollResponseParams) => {
  const eventWriter = writer(PollResponse)
    .setPollId(event.id)
    .addMention(event.pubkey)
    .addTags(...getClientTags())

  for (const selectedId of selectedIds) {
    eventWriter.addSelection(selectedId)
  }

  const [eventCommand, relays] = await Promise.all([
    command(eventWriter),
    // A vote goes to the author's relays and to whatever relays the poll itself nominated
    resolveRelays(
      [
        userOutbox(),
        ...inboxes([event.pubkey], 0.5),
        ...relaySelections(reader(Poll)(event).urls()),
      ],
      {policy: addMinimalFallbacks},
    ),
  ])

  return eventCommand.publishToRelays(relays)
}

// Deletes

// The deleted event is what a delete routes by — its relays, its kind, its address — so the plugin
// takes the event itself and fans the request out to every relay it was seen on.
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

  // Without the event we can't route by where it was seen, so fall back to the user's own relays
  const eventWriter = writer(Delete).addTags(["k", String(kind)])

  if (id) {
    eventWriter.addTags(["e", id])
  }

  if (address) {
    eventWriter.addTags(["a", address])
  }

  return command(eventWriter).then(publishToUserRelays)
}

// Follows

// Welshman deleted tagPubkey, so build the follow entry here — an outbox hint read from cache and
// the profile's display name as a petname, the way coracle has always written them.
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
    .then(publishToUserRelays)
}

export const unfollow = async (value: string) => {
  if (!app.get().user) {
    return anonymous.update($a => ({...$a, follows: $a.follows.filter(nthNe(1, value))}))
  }

  return followLists.get().unfollow(value).then(publishToUserRelays)
}

// Feed favorites

export const addFeedFavorite = async (address: string) =>
  feedLists.get().addFeed(address).then(publishToUserRelays)

export const removeFeedFavorite = async (address: string) =>
  feedLists.get().removeFeed(address).then(publishToUserRelays)

// Relay feeds

export const setRelayFeeds = async (urls: string[]) => {
  const kind = userListKind(RELAY_FEEDS)
  const event = getUserEvent(RELAY_FEEDS)
  const eventWriter = writer(kind, event ? await reader(kind)(event) : undefined)
    .dropPublic(t => ["r", "relay"].includes(t[0]))
    .addPublic(...urls.map(url => ["relay", url]))

  return command(eventWriter).then(publishToUserRelays)
}

// Relays

export const requestRelayAccess = async (url: string, claim: string) =>
  command(writer(RelayJoin).setClaim(claim).forceRelays(url)).then(publish)

// Signed out, coracle keeps relay selections in memory. A RelayListWriter edits the tags it holds,
// so the same edit runs without an event, a signer or a publish.
const editRelayList = async (fn: (writer: RelayListWriter) => void) => {
  if (!app.get().user) {
    const eventWriter = writer(RelayList).addTags(...anonymous.get().relays)

    fn(eventWriter)

    return anonymous.update($a => ({...$a, relays: eventWriter.extraTags}))
  }

  // A relay list routes itself to the indexers and to every relay it gains or loses, without a
  // limit, so a relay always hears when it's added to or dropped from the list
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

  // Don't publish a messaging relay list just to remove a relay that was never on it
  if (!enabled && !urls.includes(normalizeRelayUrl(url))) {
    return
  }

  return (
    $messagingRelayLists
      // removeUrl first, since addUrl doesn't dedupe
      .update(eventWriter =>
        enabled ? eventWriter.removeUrl(url).addUrl(url) : eventWriter.removeUrl(url),
      )
      .then(publishToUserRelaysAndIndexers)
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

  // A note to self has no other party, and a direct message has to p-tag someone
  for (const recipient of others.length > 0 ? others : [pubkey]) {
    eventWriter.addRecipient(recipient)
  }

  // Wraps publishes directly, since a single rumor fans out to one wrap per recipient, each
  // addressed to that recipient's own messaging relays
  return eventWriter.renderTemplate().then(event => wraps.get().publish({event, recipients, delay}))
}

// Settings

export const setAppData = async (d: string, data: any) => {
  if (!app.get().user) {
    return
  }

  const eventWriter = writer(AppData).setIdentifier(d).setValues(data).setEncrypted(true)

  return command(eventWriter).then(publishToUserRelays)
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
  // Wallet configuration is coracle's own per-account metadata, stored alongside the session.
  // SessionWithMeta in src/engine/model.ts doesn't declare it yet.
  const {wallet} = (get(session) || {}) as {wallet?: Wallet}

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
