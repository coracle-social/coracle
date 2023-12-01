import {generatePrivateKey, getPublicKey} from "nostr-tools"
import {now, createEvent} from "paravel"
import {without, partition, prop} from "ramda"
import {updateIn, randomId, filterVals} from "hurdak"
import {Naddr} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {Publisher} from "src/engine/network/utils"
import {pubkey, sessions} from "src/engine/session/state"
import {nip59, signer, session} from "src/engine/session/derived"
import {displayPubkey} from "src/engine/people/utils"
import {publishCommunitiesList} from "src/engine/lists/commands"
import {
  getPubkeyHints,
  getUserRelayUrls,
  getGroupHints,
  getGroupRelayUrls,
  mergeHints,
} from "src/engine/relays/utils"
import {GroupAccess, MemberAccess, MembershipLevel} from "./model"
import {groups, groupAdminKeys, groupSharedKeys} from "./state"
import {
  deriveGroupAccess,
  deriveMembershipLevel,
  deriveAdminKeyForGroup,
  deriveSharedKeyForGroup,
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
    members: [],
  }

  groupSharedKeys.key(pubkey).set(key)

  return key
}

export const initGroup = (members, relays) => {
  const id = randomId()
  const privkey = generatePrivateKey()
  const pubkey = getPublicKey(privkey)
  const address = `34550:${pubkey}:${id}`
  const sharedKey = initSharedKey(address)
  const adminKey = {
    group: address,
    pubkey: pubkey,
    privkey: privkey,
    created_at: now(),
    relays,
    members,
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
  const {pubkey} = Naddr.fromTagValue(address)
  const relays = group?.relays || getUserRelayUrls("write")
  const event = await nip59.get().wrap(template, {
    wrap: {
      author: generatePrivateKey(),
      recipient: pubkey,
    },
  })

  return Publisher.publish({event, relays})
}

export const publishAsGroupAdminPublicly = async (address, template, relays = null) => {
  const adminKey = deriveAdminKeyForGroup(address).get()
  const event = await signer.get().signWithKey(template, adminKey.privkey)

  return Publisher.publish({event, relays: getGroupPublishRelays(address, relays)})
}

export const publishAsGroupAdminPrivately = async (address, template, relays = null) => {
  const adminKey = deriveAdminKeyForGroup(address).get()
  const sharedKey = deriveSharedKeyForGroup(address).get()

  const event = await nip59.get().wrap(template, {
    author: adminKey.privkey,
    wrap: {
      author: sharedKey.privkey,
      recipient: sharedKey.pubkey,
    },
  })

  return Publisher.publish({event, relays: getGroupPublishRelays(address, relays)})
}

export const publishToGroupsPublicly = async (
  addresses,
  template,
  {relays = null, anonymous = false} = {}
) => {
  for (const address of addresses) {
    const {access} = groups.key(address).get()

    if (access === GroupAccess.Closed) {
      throw new Error("Attempted to publish publicly to a closed group")
    }
  }

  template = updateIn(
    "tags",
    (tags: string[][]) => [...tags, ...addresses.map(a => ["a", a])],
    template
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
  {relays = null, anonymous = false} = {}
) => {
  const pubs = []
  for (const address of addresses) {
    const thisTemplate = updateIn("tags", (tags: string[][]) => [...tags, ["a", address]], template)
    const {access} = groups.key(address).get()
    const sharedKey = deriveSharedKeyForGroup(address).get()
    const membershipStatus = deriveMembershipLevel(address).get()

    if (access === GroupAccess.Open) {
      throw new Error("Attempted to publish privately to a group that does not allow it")
    }

    if (membershipStatus !== MembershipLevel.Private) {
      throw new Error("Attempted to publish privately to a group the user is not a member of")
    }

    const event = await nip59.get().wrap(thisTemplate, {
      author: anonymous ? generatePrivateKey() : session.get().privkey,
      wrap: {
        author: sharedKey.privkey,
        recipient: sharedKey.pubkey,
      },
    })

    pubs.push(
      Publisher.publish({event, relays: relays || mergeHints(addresses.map(getGroupPublishRelays))})
    )
  }

  return pubs
}

export const publishToZeroOrMoreGroups = async (
  addresses,
  template,
  {relays, anonymous = false, shouldWrap = true}
) => {
  if (addresses.length === 0) {
    const event = anonymous
      ? await signer.get().signWithKey(template, generatePrivateKey())
      : await signer.get().signAsUser(template)

    return [await Publisher.publish({relays, event})]
  }

  const [wrap, nowrap] = partition(a => {
    const access = deriveGroupAccess(a).get()
    const membershipLevel = deriveMembershipLevel(a).get()

    if (membershipLevel === MembershipLevel.Private) {
      if (access === GroupAccess.Closed) {
        return true
      }

      if (access === GroupAccess.Hybrid) {
        return shouldWrap
      }
    }

    return false
  }, addresses)

  const subs = []

  if (wrap.length > 0) {
    for (const sub of await publishToGroupsPrivately(wrap, template, {anonymous})) {
      subs.push(sub)
    }
  }

  if (nowrap.length > 0) {
    subs.push(await publishToGroupsPublicly(nowrap, template, {relays, anonymous}))
  }

  return subs
}

// Admin functions

export const publishKeyRotations = async (address, pubkeys, template) => {
  const adminKey = deriveAdminKeyForGroup(address).get()

  return await Promise.all(
    pubkeys.map(async pubkey => {
      const relays = getPubkeyHints(pubkey, "read")
      const event = await nip59.get().wrap(template, {
        author: adminKey.privkey,
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      })

      return Publisher.publish({event, relays})
    })
  )
}

export const publishGroupInvites = async (address, pubkeys, relays, gracePeriod = 0) => {
  const template = createEvent(24, {
    tags: [
      ["a", address],
      ["grace_period", String(gracePeriod)],
      ["privkey", deriveSharedKeyForGroup(address).get().privkey],
      ...relays.map(url => ["relay", url]),
    ],
  })

  return publishKeyRotations(address, pubkeys, template)
}

export const publishGroupEvictions = async (address, pubkeys) =>
  publishKeyRotations(address, pubkeys, createEvent(24, {tags: [["a", address]]}))

export const publishGroupMeta = async (address, meta) => {
  const template = createEvent(34550, {
    tags: [
      ["d", meta.id],
      ["name", meta.name],
      ["image", meta.image],
      ["description", meta.description],
      ["access", meta.access],
      ...meta.relays.map(url => ["relay", url]),
    ],
  })

  return meta.access === GroupAccess.Closed
    ? publishAsGroupAdminPrivately(address, template, meta.relays)
    : publishAsGroupAdminPublicly(address, template, meta.relays)
}

// Member functions

export const modifyGroupStatus = (session, address, timestamp, updates) => {
  session.groups = session.groups || {}
  session.groups[address] = updateRecord(session.groups[address], timestamp, updates)

  return session
}

export const setGroupStatus = (pubkey, address, timestamp, updates) =>
  sessions.update($sessions => ({
    ...$sessions,
    [pubkey]: modifyGroupStatus($sessions[pubkey], address, timestamp, updates),
  }))

export const resetMemberAccess = address =>
  setGroupStatus(pubkey.get(), address, now(), {access: MemberAccess.None})

export const publishGroupEntryRequest = address => {
  setGroupStatus(pubkey.get(), address, now(), {access: MemberAccess.Requested})

  return publishToGroupAdmin(
    address,
    createEvent(25, {
      content: `${displayPubkey(pubkey.get())} would like to join the group`,
      tags: [["a", address]],
    })
  )
}

export const publishGroupExitRequest = address => {
  setGroupStatus(pubkey.get(), address, now(), {access: MemberAccess.None})

  return publishToGroupAdmin(
    address,
    createEvent(26, {
      content: `${displayPubkey(pubkey.get())} is leaving the group`,
      tags: [["a", address]],
    })
  )
}

export const joinPublicGroup = address =>
  publishCommunitiesList(
    Object.keys(filterVals(prop("joined"), session.get().groups)).concat(address)
  )

export const leavePublicGroup = address =>
  publishCommunitiesList(
    without([address], Object.keys(filterVals(prop("joined"), session.get().groups)))
  )

export const joinGroup = address => {
  console.log(deriveGroupAccess(address).get())
  if (deriveGroupAccess(address).get() === GroupAccess.Open) {
    joinPublicGroup(address)
  } else {
    publishGroupEntryRequest(address)
  }
}

export const leaveGroup = address => {
  if (deriveGroupAccess(address).get() === GroupAccess.Open) {
    leavePublicGroup(address)
  } else {
    publishGroupExitRequest(address)
  }
}
