import {nwc} from "@getalby/sdk"
import {
  append,
  first,
  nthEq,
  nthNe,
  now,
  parseJson,
  partition,
  remove,
  sha256,
  uniq,
} from "@welshman/lib"
import {User, publish} from "@welshman/app"
import {Nip01Signer} from "@welshman/signer"
import {isLink, parse} from "@welshman/content"
import {AppData, Delete, DirectMessage, Poll, RelayJoin, RelayList} from "@welshman/domain"
import type {DirectMessageWriter, RelayListWriter} from "@welshman/domain"
import {
  FOLLOWS,
  MESSAGING_RELAYS,
  PROFILE,
  RELAYS,
  isNWCWallet,
  isSignedEvent,
  isWebLNWallet,
  canUploadBlob,
  encryptFile,
  makeBlossomAuthEvent,
  normalizeRelayUrl,
  relay,
  stamp,
  tagSpec,
  tagValue,
  uploadBlob,
} from "@welshman/util"
import type {EventTemplate, TrustedEvent} from "@welshman/util"
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
  thunks,
  wraps,
  writer,
} from "src/engine/core"
import {anonymous, getClientTags, sessionWithMeta} from "src/engine/state"
import {DirectMessageFile, PollVote, userListKind} from "src/domain"
import type {CompressorOpts} from "src/util/html"
import {stripExifData} from "src/util/html"
import {appDataKeys, RELAY_FEEDS, tagsFromIMeta} from "src/util/nostr"

// Helpers

const getUserEvent = (kind: number) => {
  const $app = app.get()

  return $app.user
    ? first($app.repository.query([{kinds: [kind], authors: [$app.user.pubkey]}]))
    : undefined
}

// Files

export type UploadFileOptions = {
  encrypt?: boolean
  compressorOpts?: CompressorOpts
}

// A subtype worth putting on a url is a plain word; anything else keeps whatever the server named
// the blob, since the extension is only ever a hint about how to display it.
const getExtension = (type: string) => {
  const [, subtype = ""] = type.split("/")

  return /^[a-z0-9]+$/.test(subtype) ? "." + subtype : ""
}

export const uploadFile = async (
  server: string,
  file: File,
  {encrypt, compressorOpts}: UploadFileOptions = {},
) => {
  const {name} = file
  const tags: string[][] = []

  if (!file.type.match("image/(webp|gif)")) {
    file = await stripExifData(file, compressorOpts)
  }

  // Read the type off the compressed file, since compressorjs re-encodes a large png as a jpeg
  const {type} = file

  // Encrypt before the upload rather than after, so the server only ever holds ciphertext. The key
  // travels with the message instead, which is why this is only worth doing where the message
  // itself is encrypted.
  if (encrypt) {
    const {ciphertext, key, nonce, algorithm} = await encryptFile(file)

    tags.push(
      ["decryption-key", key],
      ["decryption-nonce", nonce],
      ["encryption-algorithm", algorithm],
    )

    file = new File([ciphertext], name, {type: "application/octet-stream"})
  }

  const hashes = [await sha256(await file.arrayBuffer())]
  const $signer = app.get().user?.signer || Nip01Signer.ephemeral()
  const authEvent = await $signer.sign(makeBlossomAuthEvent({action: "upload", server, hashes}))

  // What a server takes is its own business, so ask before spending the upload — an encrypted file
  // arrives as octet-stream, which a server that only wanted images will turn away. Only an answer
  // that refuses stops us: a 404, a 405, or a request that doesn't come back at all is a server
  // without BUD-06 rather than one saying no, and the upload itself is the better judge.
  const check = await canUploadBlob(server, {
    authEvent,
    headers: {
      "X-Content-Type": file.type,
      "X-Content-Length": String(file.size),
      "X-SHA-256": hashes[0],
    },
  }).catch(() => undefined)

  if (check && ![200, 404, 405].includes(check.status)) {
    return {
      error: check.headers.get("X-Reason") || `${name} was refused (HTTP ${check.status})`,
      tags,
    }
  }

  const res = await uploadBlob(server, file, {authEvent})
  const text = await res.text()
  const task = parseJson(text)

  if (!task) {
    return {error: text, tags}
  }

  // An encrypted blob is uploaded as octet-stream, so the server names it accordingly. Put the real
  // extension back — it's how the recipient decides whether the url is an image, a video or a link.
  const url = encrypt ? task.url.replace(/\.\w+$/, "") + getExtension(type) : task.url

  return {...task, url, tags}
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

export const sendMessage = async (
  channelId: string,
  content: string,
  delay: number,
  tags: string[][] = [],
) => {
  const {pubkey} = User.require(app.get())
  const recipients = uniq(channelId.split(",").concat(pubkey))
  const others = remove(pubkey, recipients)

  // The channel is identified by its p tags, so a mention would fork the conversation
  const [imetaTags, extraTags] = partition(nthEq(0, "imeta"), tags.filter(nthNe(0, "p")))
  const imetas = imetaTags.map(tag => tagsFromIMeta(tag.slice(1)))

  const addRecipients = <T extends DirectMessageWriter>(eventWriter: T) => {
    for (const recipient of others.length > 0 ? others : [pubkey]) {
      eventWriter.addRecipient(recipient)
    }

    return eventWriter
  }

  const templates: EventTemplate[] = []
  const buffer: string[] = []

  const flushText = async () => {
    const text = buffer.splice(0).join("").trim()

    if (text) {
      const eventWriter = writer(DirectMessage)
        .setContent(text)
        .addTags(...extraTags, ...getClientTags())

      templates.push(await addRecipients(eventWriter).renderTemplate())
    }
  }

  // NIP-17 gives each file its own kind 15, so split the message around its attachments rather
  // than sending the urls as text that only a client reading our imeta could make sense of.
  for (const parsed of parse({content, tags})) {
    const url = isLink(parsed) ? parsed.value.url.toString() : undefined
    const imeta = url ? imetas.find(meta => tagValue(tagSpec("url"), meta) === url) : undefined

    if (!imeta) {
      buffer.push(parsed.raw)
      continue
    }

    await flushText()

    const eventWriter = writer(DirectMessageFile)
      .setFile(url, imeta)
      .addTags(...getClientTags())

    templates.push(await addRecipients(eventWriter).renderTemplate())
  }

  await flushText()

  // Stamp them a second apart so the pieces of one message keep their order in the conversation
  const created_at = now()

  return Promise.all(
    templates.map((event, i) =>
      wraps.get().publish({event: stamp(event, created_at + i), recipients, delay}),
    ),
  )
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
