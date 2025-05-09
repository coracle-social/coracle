import {
  follow as baseFollow,
  unfollow as baseUnfollow,
  inboxRelaySelectionsByPubkey,
  pubkey,
  repository,
  session,
  signer,
  tagPubkey,
  userInboxRelaySelections,
  userRelaySelections,
  publishThunk,
} from "@welshman/app"
import {append, now, remove, nthNe, uniq, bufferToHex} from "@welshman/lib"
import {Nip01Signer, Nip59} from "@welshman/signer"
import type {Profile, TrustedEvent} from "@welshman/util"
import {uploadBlossom} from "@welshman/editor"
import {Router, addMaximalFallbacks, addMinimalFallbacks} from "@welshman/router"
import {
  Address,
  DELETE,
  FEEDS,
  FOLLOWS,
  INBOX_RELAYS,
  PROFILE,
  RELAYS,
  addToListPublicly,
  makeEvent,
  createProfile,
  editProfile,
  getAddress,
  isPublishedProfile,
  isSignedEvent,
  makeList,
  normalizeRelayUrl,
  removeFromList,
  getRelaysFromList,
} from "@welshman/util"
import {
  addClientTags,
  anonymous,
  getClientTags,
  sign,
  userFeedFavorites,
  withIndexers,
} from "src/engine/state"
import {blobToFile, stripExifData} from "src/util/html"
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

export const hashFile = async (file: File) =>
  bufferToHex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))

export const uploadFile = async (serverUrl: string, file: File, compressorOpts = {}) => {
  const $signer = signer.get() || Nip01Signer.ephemeral()

  if (!file.type.match("image/(webp|gif)")) {
    file = blobToFile(await stripExifData(file, compressorOpts))
  }

  return uploadBlossom({file, serverUrl, sign: $signer.sign, hash: hashFile})
}

// Key state management

export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMaximalFallbacks).getUrls()

  return await publishThunk({event, relays})
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

  return publishThunk({
    event: makeEvent(DELETE, {tags}),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

export const deleteEvent = (event: TrustedEvent) =>
  publishDeletion({id: event.id, address: getAddress(event), kind: event.kind})

export const deleteEventByAddress = (address: string) =>
  publishDeletion({address, kind: Address.from(address).kind})

// Profile

export const publishProfile = (profile: Profile) => {
  const relays = withIndexers(Router.get().FromUser().getUrls())
  const template = isPublishedProfile(profile) ? editProfile(profile) : createProfile(profile)

  return publishThunk({event: addClientTags(template), relays})
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

  return publishThunk({
    event: await removeFromList(list, address).reconcile(nip44EncryptToSelf),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

export const addFeedFavorite = async (address: string) => {
  const list = get(userFeedFavorites) || makeList({kind: FEEDS})

  return publishThunk({
    event: await addToListPublicly(list, ["a", address]).reconcile(nip44EncryptToSelf),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}

// Relays

export const requestRelayAccess = async (url: string, claim: string) =>
  publishThunk({event: makeEvent(28934, {tags: [["claim", claim]]}), relays: [url]})

export const setOutboxPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  if (signer.get()) {
    const list = get(userRelaySelections) || makeList({kind: RELAYS})

    publishThunk({
      event: makeEvent(list.kind, {
        content: list.event?.content || "",
        tags: modifyTags(list.publicTags),
      }),
      relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
    })
  } else {
    anonymous.update($a => ({...$a, relays: modifyTags($a.relays)}))
  }
}

export const setInboxPolicies = async (modifyTags: (tags: string[][]) => string[][]) => {
  const list = get(userInboxRelaySelections) || makeList({kind: INBOX_RELAYS})

  publishThunk({
    event: makeEvent(list.kind, {
      content: list.event?.content || "",
      tags: modifyTags(list.publicTags),
    }),
    relays: withIndexers(Router.get().FromUser().policy(addMaximalFallbacks).getUrls()),
  })
}

export const setInboxPolicy = (url: string, enabled: boolean) => {
  const urls = getRelaysFromList(inboxRelaySelectionsByPubkey.get().get(pubkey.get()))

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

    publishThunk({
      event: rumor.wrap,
      relays: Router.get().PubkeyInbox(recipient).policy(addMinimalFallbacks).getUrls(),
      delay,
    })
  }
}

// Settings

export const setAppData = async (d: string, data: any) => {
  if (signer.get()) {
    const {pubkey} = session.get()
    const content = await signer.get().nip04.encrypt(pubkey, JSON.stringify(data))

    return publishThunk({
      event: makeEvent(30078, {tags: [["d", d]], content}),
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
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
      await publishThunk({event, relays})
    }
  }
}
