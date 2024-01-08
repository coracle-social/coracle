import {partition} from "ramda"
import {now, createEvent} from "paravel"
import {updateIn, randomId} from "hurdak"
import {generatePrivateKey, getPublicKey, Naddr} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {Publisher, getClientTags, mention} from "src/engine/network/utils"
import {pubkey} from "src/engine/session/state"
import {nip59, signer, session} from "src/engine/session/derived"
import {updateSession} from "src/engine/session/commands"
import {displayPubkey} from "src/engine/people/utils"
import {
  getPubkeyHints,
  getUserHints,
  getGroupHints,
  getGroupRelayUrls,
  mergeHints,
} from "src/engine/relays/utils"
import {GroupAccess} from "./model"
import {groups, groupAdminKeys, groupSharedKeys} from "./state"
import {deriveAdminKeyForGroup, deriveSharedKeyForGroup, deriveIsGroupMember} from "./utils"

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

// Utils for publishing

export const getGroupPublishRelays = (address, overrides = null) => {
  if (overrides?.length > 0) {
    return overrides
  }

  const canonical = getGroupRelayUrls(address)

  if (canonical.length > 0) {
    return canonical
  }

  return getGroupHints(address)
}

export const publishToGroupAdmin = async (address, template) => {
  const group = groups.key(address).get()
  const naddr = Naddr.fromTagValue(address)
  const relays = group?.relays || getUserHints("write")
  const pubkeys = [naddr.pubkey, session.get().pubkey]

  return await Promise.all(
    pubkeys.map(async pubkey => {
      const rumor = await nip59.get().wrap(template, {
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      })

      return Publisher.publish({event: rumor.wrap, relays})
    }),
  )
}

export const publishAsGroupAdminPublicly = async (address, template, relays = null) => {
  const adminKey = deriveAdminKeyForGroup(address).get()
  const event = await signer.get().signWithKey(template, adminKey.privkey)

  return Publisher.publish({event, relays: getGroupPublishRelays(address, relays)})
}

export const publishAsGroupAdminPrivately = async (address, template, relays = null) => {
  const adminKey = deriveAdminKeyForGroup(address).get()
  const sharedKey = deriveSharedKeyForGroup(address).get()

  const rumor = await nip59.get().wrap(template, {
    author: adminKey.privkey,
    wrap: {
      author: sharedKey.privkey,
      recipient: sharedKey.pubkey,
    },
  })

  return Publisher.publish({
    event: rumor.wrap,
    relays: getGroupPublishRelays(address, relays),
  })
}

export const publishToGroupsPublicly = async (
  addresses,
  template,
  {relays = null, anonymous = false} = {},
) => {
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

  return Publisher.publish({
    event,
    relays: relays || mergeHints(addresses.map(getGroupPublishRelays)),
  })
}

export const publishToGroupsPrivately = async (
  addresses,
  template,
  {relays = null, anonymous = false} = {},
) => {
  const pubs = []
  const events = []
  for (const address of addresses) {
    const thisTemplate = updateIn("tags", (tags: string[][]) => [...tags, ["a", address]], template)
    const sharedKey = deriveSharedKeyForGroup(address).get()

    if (!address.startsWith("35834:")) {
      throw new Error("Attempted to publish privately to an invalid address", address)
    }

    if (!deriveIsGroupMember(address).get()) {
      throw new Error("Attempted to publish privately to a group the user is not a member of")
    }

    const rumor = await nip59.get().wrap(thisTemplate, {
      author: anonymous ? generatePrivateKey() : session.get().privkey,
      wrap: {
        author: sharedKey.privkey,
        recipient: sharedKey.pubkey,
      },
    })

    events.push(rumor)

    pubs.push(
      Publisher.publish({
        event: rumor.wrap,
        relays: relays || mergeHints(addresses.map(getGroupPublishRelays)),
      }),
    )
  }

  return {pubs, events}
}

export const publishToZeroOrMoreGroups = async (
  addresses,
  template,
  {relays, anonymous = false},
) => {
  const pubs = []
  const events = []

  if (addresses.length === 0) {
    const event = anonymous
      ? await signer.get().signWithKey(template, generatePrivateKey())
      : await signer.get().signAsUser(template)

    events.push(event)
    pubs.push(Publisher.publish({relays, event}))
  } else {
    const [wrap, nowrap] = partition(address => address.startsWith("35834:"), addresses)

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
      const pub = await publishToGroupsPublicly(nowrap, template, {relays, anonymous})

      pubs.push(pub)
      events.push(pub.event)
    }
  }

  return {pubs, events}
}

// Admin functions

export const publishKeyShares = async (address, pubkeys, template) => {
  const adminKey = deriveAdminKeyForGroup(address).get()

  return await Promise.all(
    pubkeys.map(async pubkey => {
      const rumor = await nip59.get().wrap(template, {
        author: adminKey.privkey,
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      })

      return Publisher.publish({
        event: rumor.wrap,
        relays: getPubkeyHints(pubkey, "read"),
      })
    }),
  )
}

export const publishAdminKeyShares = async (address, pubkeys, relays) => {
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

export const publishGroupInvites = async (address, pubkeys, relays, gracePeriod = 0) => {
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

  return publishAsGroupAdminPublicly(address, template, relays)
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
    ? publishAsGroupAdminPublicly(address, template, relays)
    : publishAsGroupAdminPrivately(address, template, relays)
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
