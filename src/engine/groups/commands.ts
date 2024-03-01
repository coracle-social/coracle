import {partition} from "ramda"
import {now, createEvent, Address} from "paravel"
import {updateIn, randomId} from "hurdak"
import {generatePrivateKey, getPublicKey} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {Publisher, getClientTags, mention} from "src/engine/network/utils"
import {pubkey} from "src/engine/session/state"
import {nip44, nip59, signer, session} from "src/engine/session/derived"
import {updateSession} from "src/engine/session/commands"
import {displayPubkey} from "src/engine/people/utils"
import {hints} from "src/engine/relays/utils"
import {GroupAccess} from "./model"
import {groups, groupAdminKeys, groupSharedKeys} from "./state"
import {
  deriveGroup,
  deriveAdminKeyForGroup,
  deriveSharedKeyForGroup,
  deriveIsGroupMember,
} from "./utils"

// Key state management

export const initSharedKey = address => {
  const privkey = generatePrivateKey()
  const pubkey = getPublicKey(privkey)
  const key = {
    group: address,
    pubkey: pubkey,
    privkey: privkey,
    created_at: now(),
  }

  groupSharedKeys.key(pubkey).set(key)

  return key
}

export const initGroup = (kind, relays) => {
  const id = randomId()
  const privkey = generatePrivateKey()
  const pubkey = getPublicKey(privkey)
  const address = `${kind}:${pubkey}:${id}`
  const sharedKey = kind === 35834 ? initSharedKey(address) : null
  const adminKey = {
    group: address,
    pubkey: pubkey,
    privkey: privkey,
    created_at: now(),
    relays,
  }

  groupAdminKeys.key(pubkey).set(adminKey)

  groups.key(address).set({id, pubkey, address, relays})

  return {id, address, adminKey, sharedKey}
}

// Most people don't have access to nip44 yet, send nip04-encrypted fallbacks for:
// - Access requests
// - Key shares

export const wrapWithFallback = async (template, {author = null, wrap}) => {
  const events = []

  if (nip44.get().isEnabled()) {
    events.push(await nip59.get().wrap(template, {author, wrap}))
  }

  events.push(
    await nip59.get().wrap(template, {
      author,
      wrap: {
        ...wrap,
        kind: 1060,
        algo: "nip04",
      },
    }),
  )

  return events
}

// Utils for publishing

export const publishToGroupAdmin = async (address, template) => {
  const addr = Address.fromRaw(address)
  const relays = hints.WithinContext(address).getUrls()
  const pubkeys = [addr.pubkey, session.get().pubkey]

  const pubs = []
  const events = []

  for (const pubkey of pubkeys) {
    const rumors = await wrapWithFallback(template, {
      wrap: {
        author: generatePrivateKey(),
        recipient: pubkey,
      },
    })

    for (const rumor of rumors) {
      events.push(rumor)
      pubs.push(Publisher.publish({event: rumor.wrap, relays}))
    }
  }

  return {pubs, events}
}

export const publishAsGroupAdminPublicly = async (address, template) => {
  const relays = hints.WithinContext(address).getUrls()
  const adminKey = deriveAdminKeyForGroup(address).get()
  const event = await signer.get().signWithKey(template, adminKey.privkey)

  return Publisher.publish({event, relays})
}

export const publishAsGroupAdminPrivately = async (address, template) => {
  const relays = hints.WithinContext(address).getUrls()
  const adminKey = deriveAdminKeyForGroup(address).get()
  const sharedKey = deriveSharedKeyForGroup(address).get()

  const rumors = await wrapWithFallback(template, {
    author: adminKey.privkey,
    wrap: {
      author: sharedKey.privkey,
      recipient: sharedKey.pubkey,
    },
  })

  const pubs = []
  const events = []

  for (const rumor of rumors) {
    events.push(rumor)

    pubs.push(Publisher.publish({event: rumor.wrap, relays}))
  }

  return {pubs, events}
}

export const publishToGroupsPublicly = async (addresses, template, {anonymous = false} = {}) => {
  for (const address of addresses) {
    if (!address.startsWith("34550:")) {
      throw new Error("Attempted to publish publicly to an invalid address", address)
    }
  }

  template = updateIn(
    "tags",
    (tags: string[][]) => [...tags, ...addresses.map(a => ["a", a])],
    template,
  )

  const event = anonymous
    ? await signer.get().signWithKey(template, generatePrivateKey())
    : await signer.get().signAsUser(template)

  return Publisher.publish({event})
}

export const publishToGroupsPrivately = async (addresses, template, {anonymous = false} = {}) => {
  const pubs = []
  const events = []
  for (const address of addresses) {
    const relays = hints.WithinContext(address).getUrls()
    const thisTemplate = updateIn("tags", (tags: string[][]) => [...tags, ["a", address]], template)
    const sharedKey = deriveSharedKeyForGroup(address).get()

    if (!address.startsWith("35834:")) {
      throw new Error("Attempted to publish privately to an invalid address", address)
    }

    if (!deriveIsGroupMember(address).get()) {
      throw new Error("Attempted to publish privately to a group the user is not a member of")
    }

    const rumors = await wrapWithFallback(thisTemplate, {
      author: anonymous ? generatePrivateKey() : null,
      wrap: {
        author: sharedKey.privkey,
        recipient: sharedKey.pubkey,
      },
    })

    for (const rumor of rumors) {
      events.push(rumor)
      pubs.push(Publisher.publish({event: rumor.wrap, relays}))
    }
  }

  return {pubs, events}
}

export const publishToZeroOrMoreGroups = async (addresses, template, {anonymous = false} = {}) => {
  const pubs = []
  const events = []

  if (addresses.length === 0) {
    const event = anonymous
      ? await signer.get().signWithKey(template, generatePrivateKey())
      : await signer.get().signAsUser(template)

    events.push(event)
    pubs.push(Publisher.publish({event}))
  } else {
    const [wrap, nowrap] = partition((address: string) => address.startsWith("35834:"), addresses)

    if (wrap.length > 0) {
      const result = await publishToGroupsPrivately(wrap, template, {anonymous})

      for (const pub of result.pubs) {
        pubs.push(pub)
      }

      for (const event of result.events) {
        events.push(event)
      }
    }

    if (nowrap.length > 0) {
      const pub = await publishToGroupsPublicly(nowrap, template, {anonymous})

      pubs.push(pub)
      events.push(pub.event)
    }
  }

  return {pubs, events}
}

// Admin functions

export const publishKeyShares = async (address, pubkeys, template) => {
  const relays = hints.WithinContext(address).getUrls()
  const adminKey = deriveAdminKeyForGroup(address).get()

  const pubs = []
  const events = []

  for (const pubkey of pubkeys) {
    const rumors = await wrapWithFallback(template, {
      author: adminKey.privkey,
      wrap: {
        author: generatePrivateKey(),
        recipient: pubkey,
      },
    })

    for (const rumor of rumors) {
      events.push(rumor)
      pubs.push(Publisher.publish({event: rumor.wrap, relays}))
    }
  }

  return {pubs, events}
}

export const publishAdminKeyShares = async (address, pubkeys) => {
  const {relays} = deriveGroup(address).get()
  const {privkey} = deriveAdminKeyForGroup(address).get()
  const template = createEvent(24, {
    tags: [
      ["a", address],
      ["role", "admin"],
      ["privkey", privkey],
      ...getClientTags(),
      ...relays.map(url => ["relay", url]),
    ],
  })

  return publishKeyShares(address, pubkeys, template)
}

export const publishGroupInvites = async (address, pubkeys, gracePeriod = 0) => {
  const {relays} = deriveGroup(address).get()
  const {privkey} = deriveSharedKeyForGroup(address).get()
  const template = createEvent(24, {
    tags: [
      ["a", address],
      ["role", "member"],
      ["privkey", privkey],
      ["grace_period", String(gracePeriod)],
      ...getClientTags(),
      ...relays.map(url => ["relay", url]),
    ],
  })

  return publishKeyShares(address, pubkeys, template)
}

export const publishGroupEvictions = async (address, pubkeys) =>
  publishKeyShares(
    address,
    pubkeys,
    createEvent(24, {
      tags: [["a", address], ...getClientTags()],
    }),
  )

export const publishGroupMembers = async (address, op, pubkeys) => {
  const template = createEvent(27, {
    tags: [["op", op], ["a", address], ...getClientTags(), ...pubkeys.map(mention)],
  })

  return publishAsGroupAdminPrivately(address, template)
}

export const publishCommunityMeta = (address, id, relays, meta) => {
  const template = createEvent(34550, {
    tags: [
      ["d", id],
      ["name", meta.name],
      ["description", meta.about],
      ["banner", meta.banner],
      ["image", meta.picture],
      ...getClientTags(),
      ...relays.map(url => ["relay", url]),
    ],
  })

  return publishAsGroupAdminPublicly(address, template)
}

export const publishGroupMeta = (address, id, relays, meta, listPublicly) => {
  const template = createEvent(35834, {
    tags: [
      ["d", id],
      ["name", meta.name],
      ["about", meta.about],
      ["banner", meta.banner],
      ["picture", meta.picture],
      ...getClientTags(),
      ...relays.map(url => ["relay", url]),
    ],
  })

  return listPublicly
    ? publishAsGroupAdminPublicly(address, template)
    : publishAsGroupAdminPrivately(address, template)
}

export const deleteGroupMeta = address =>
  publishAsGroupAdminPublicly(address, createEvent(5, {tags: [["a", address]]}))

// Member functions

export const modifyGroupStatus = (session, address, timestamp, updates) => {
  session.groups = session.groups || {}
  session.groups[address] = updateRecord(session.groups[address], timestamp, updates)

  return session
}

export const setGroupStatus = (pubkey, address, timestamp, updates) =>
  updateSession(pubkey, s => modifyGroupStatus(s, address, timestamp, updates))

export const resetGroupAccess = address =>
  setGroupStatus(pubkey.get(), address, now(), {access: GroupAccess.None})

export const publishGroupEntryRequest = (address, claim = null) => {
  setGroupStatus(pubkey.get(), address, now(), {access: GroupAccess.Requested})

  const tags = [...getClientTags(), ["a", address]]

  if (claim) {
    tags.push(["claim", claim])
  }

  return publishToGroupAdmin(
    address,
    createEvent(25, {
      content: `${displayPubkey(pubkey.get())} would like to join the group`,
      tags,
    }),
  )
}

export const publishGroupExitRequest = address => {
  setGroupStatus(pubkey.get(), address, now(), {access: GroupAccess.None})

  return publishToGroupAdmin(
    address,
    createEvent(26, {
      content: `${displayPubkey(pubkey.get())} is leaving the group`,
      tags: [...getClientTags(), ["a", address]],
    }),
  )
}
