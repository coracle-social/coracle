import type {Session} from "@welshman/app"
import {
  follow as baseFollow,
  unfollow as baseUnfollow,
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
  Router,
  addMaximalFallbacks,
  addMinimalFallbacks,
} from "@welshman/app"
import {
  identity,
  append,
  cached,
  groupBy,
  now,
  remove,
  prop,
  flatten,
  nthNe,
  uniq,
  assoc,
  omit,
  fetchJson,
  sleep,
  tryCatch,
} from "@welshman/lib"
import {Nip01Signer, Nip46Broker, Nip59, makeSecret} from "@welshman/signer"
import type {Profile, TrustedEvent} from "@welshman/util"
import {
  Address,
  FEEDS,
  FOLLOWS,
  INBOX_RELAYS,
  PROFILE,
  RELAYS,
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
  getTagValue,
  uniqTags,
} from "@welshman/util"
import crypto from "crypto"
import {
  addClientTags,
  anonymous,
  createAndPublish,
  getClientTags,
  publish,
  sign,
  userFeedFavorites,
  withIndexers,
} from "src/engine/state"
import {blobToFile, stripExifData} from "src/util/html"
import {joinPath} from "src/util/misc"
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

  return fetchJson(url, {body, method, headers})
}

export const getMediaProviderURL = cached({
  maxSize: 10,
  getKey: ([url]) => url,
  getValue: ([url]) => fetchMediaProviderURL(url),
})

const fetchMediaProviderURL = async host =>
  prop("api_url")(await fetchJson(joinPath(host, ".well-known/nostr/nip96.json")))

const fileToFormData = file => {
  const formData = new FormData()

  formData.append("file[]", file)

  return formData
}

export const uploadFileToHost = async <T = any>(url: string, file: File): Promise<T> => {
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

export const uploadFilesToHost = <T = any>(url: string, files: File[]): Promise<T[]> =>
  Promise.all(files.map(file => tryCatch(async () => await uploadFileToHost<T>(url, file))))

export const uploadFileToHosts = <T = any>(urls: string[], file: File): Promise<T[]> =>
  Promise.all(urls.map(url => tryCatch(async () => await uploadFileToHost<T>(url, file))))

export const uploadFilesToHosts = async <T = any>(urls: string[], files: File[]): Promise<T[]> =>
  flatten(await Promise.all(urls.map(url => uploadFilesToHost<T>(url, files)))).filter(identity)

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
  const tagsByHash = groupBy(
    imeta => getTagValue("ox", imeta),
    events.map(e => e.tags),
  )

  return uniqTags(Array.from(tagsByHash.values()).flatMap(identity).flatMap(identity))
}

export const uploadFiles = async (urls, files, compressorOpts = {}) => {
  const compressedFiles = await compressFiles(files, compressorOpts)
  const nip94Events = await uploadFilesToHosts(urls, compressedFiles)

  return eventsToMeta(nip94Events as TrustedEvent[])
}

// Key state management

export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMaximalFallbacks).getUrls()

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
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    forcePlatform: false,
  })
}

export const deleteEvent = (event: TrustedEvent) =>
  publishDeletion({id: event.id, address: getAddress(event), kind: event.kind})

export const deleteEventByAddress = (address: string) =>
  publishDeletion({address, kind: Address.from(address).kind})

// Profile

export const publishProfile = (profile: Profile, {forcePlatform = false} = {}) => {
  const relays = withIndexers(Router.get().FromUser().getUrls())
  const template = isPublishedProfile(profile) ? editProfile(profile) : createProfile(profile)

  return createAndPublish({...addClientTags(template), relays, forcePlatform})
}

// Follows

export const unfollow = async (value: string) =>
  signer.get()
    ? baseUnfollow(value)
    : anonymous.update($a => ({...$a, follows: $a.follows.filter(nthNe(1, value))}))

export const follow = async (tag: string[]) =>
  signer.get()
    ? baseFollow(tag)
    : anonymous.update($a => ({...$a, follows: append(tag, $a.follows)}))

// Feed favorites

export const removeFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})
  const template = await removeFromList(list, address).reconcile(nip44EncryptToSelf)

  return createAndPublish({
    ...template,
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

export const addFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})
  const template = await addToListPublicly(list, ["a", address]).reconcile(nip44EncryptToSelf)

  return createAndPublish({
    ...template,
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
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
      relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
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
    relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
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

// Messages

export const sendMessage = async (channelId: string, content: string, delay: number) => {
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

    // Publish immediately to the repository so messages show up right away
    repository.publish(rumor)

    // Publish via thunk
    publish({
      event: rumor.wrap,
      relays: Router.get().PubkeyInbox(recipient).policy(addMinimalFallbacks).getUrls(),
      forcePlatform: false,
      delay,
    })
  }
}

// Session/login

const addSession = (s: Session) => {
  sessions.update(assoc(s.pubkey, s))
  pubkey.set(s.pubkey)
}

export const loginWithPublicKey = pubkey => addSession({method: "pubkey", pubkey})

export const loginWithNip07 = pubkey => addSession({method: "nip07", pubkey})

export const loginWithNip55 = (pubkey, pkg) =>
  addSession({method: "nip55", pubkey: pubkey, signer: pkg})

export const loginWithNip46 = async ({
  relays,
  signerPubkey,
  clientSecret = makeSecret(),
  connectSecret = "",
}: {
  relays: string[]
  signerPubkey: string
  clientSecret?: string
  connectSecret?: string
}) => {
  const broker = Nip46Broker.get({relays, clientSecret, signerPubkey})
  const result = await broker.connect(connectSecret, nip46Perms)

  // TODO: remove ack result
  if (!["ack", connectSecret].includes(result)) return false

  const pubkey = await broker.getPublicKey()

  if (!pubkey) return false

  const handler = {relays, pubkey: signerPubkey}

  addSession({method: "nip46", pubkey, secret: clientSecret, handler})

  return true
}

export const logoutPubkey = pubkey => {
  if (session.get().pubkey === pubkey) {
    throw new Error("Can't destroy the current session, use logout instead")
  }

  sessions.update(s => omit([pubkey], s))
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
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
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
