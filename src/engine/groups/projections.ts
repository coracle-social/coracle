import {uniq, assoc, whereEq, sortBy, prop, without, mergeRight} from "ramda"
import {Tags, getIdFilters, decodeAddress, getAddress} from "@coracle.social/util"
import {switcherFn, batch} from "hurdak"
import {LOCAL_RELAY_URL, giftWrapKinds, getPublicKey} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import {updateStore} from "src/engine/core/commands"
import type {Event} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {getExecutor, tracker, load} from "src/engine/network/utils"
import {hints} from "src/engine/relays/utils"
import {GroupAccess} from "./model"
import {groups, groupSharedKeys, groupAdminKeys, groupRequests, groupAlerts} from "./state"
import {
  deriveAdminKeyForGroup,
  getRecipientKey,
  deriveGroupStatus,
  getUserCommunities,
} from "./utils"
import {setGroupStatus, modifyGroupStatus} from "./commands"

// Key sharing

projections.addHandler(24, (e: Event) => {
  const tags = Tags.fromEvent(e)
  const privkey = tags.get("privkey")?.value()
  const address = tags.get("a")?.value()
  const recipient = Tags.fromEvent(e.wrap).get("p")?.value()
  const relays = tags.values("relay").valueOf()

  if (!address) {
    return
  }

  const status = deriveGroupStatus(address).get()

  if (privkey) {
    const pubkey = getPublicKey(privkey)
    const role = tags.get("role")?.value()
    const keys = role === "admin" ? groupAdminKeys : groupSharedKeys

    keys.key(pubkey).update($key => ({
      pubkey,
      privkey,
      group: address,
      created_at: e.created_at,
      hints: relays,
      ...$key,
    }))

    // Notify the user if this isn't just a key rotation
    if (status?.access !== GroupAccess.Granted) {
      groupAlerts.key(e.id).set({...e, group: address, type: "invite"})
    }

    // Load the group's metadata and posts
    load({
      relays: hints.scenario([relays]).getUrls(),
      filters: [
        ...getIdFilters([address]),
        {kinds: giftWrapKinds, "#p": [pubkey]},
        {kinds: giftWrapKinds, authors: [pubkey]},
      ],
    })
  } else if ([GroupAccess.Granted, GroupAccess.Requested].includes(status?.access)) {
    groupAlerts.key(e.id).set({...e, group: address, type: "exit"})
  }

  if (relays.length > 0) {
    const {pubkey, identifier} = decodeAddress(address)

    if (!groups.key(address).get()) {
      groups.key(address).set({address, pubkey, id: identifier, relays})
    }
  }

  setGroupStatus(recipient, address, e.created_at, {
    access: privkey ? GroupAccess.Granted : GroupAccess.Revoked,
  })
})

// Group metadata

projections.addHandler(35834, (e: Event) => {
  const tags = Tags.fromEvent(e)
  const meta = tags.asObject()
  const address = getAddress(e)
  const group = groups.key(address)

  group.merge({address, id: meta.d, pubkey: e.pubkey})

  updateStore(group, e.created_at, {
    relays: tags.values("relay").valueOf(),
    listing_is_public: !e.wrap,
    meta: {
      name: meta.name,
      about: meta.about,
      banner: meta.banner,
      picture: meta.picture,
    },
  })
})

projections.addHandler(34550, (e: Event) => {
  const tags = Tags.fromEvent(e)
  const meta = tags.asObject()
  const address = getAddress(e)
  const group = groups.key(address)

  group.merge({address, id: meta.d, pubkey: e.pubkey})

  updateStore(group, e.created_at, {
    relays: tags.values("relay").valueOf(),
    listing_is_public: true,
    meta: {
      name: meta.name,
      about: meta.description,
      banner: meta.image,
      picture: meta.image,
    },
  })
})

projections.addHandler(27, (e: Event) => {
  const address = Tags.fromEvent(e).groups().values().first()

  if (!address) {
    return
  }

  let {members = [], recent_member_updates = []} = groups.key(address).get() || {}

  // Only replay updates if we have something new
  if (!recent_member_updates.find(whereEq({id: e.id}))) {
    recent_member_updates = sortBy(prop("created_at"), recent_member_updates.concat(e)).slice(-100)

    for (const event of recent_member_updates) {
      const tags = Tags.fromEvent(event)
      const op = tags.get("op")?.value()
      const pubkeys = tags.values("p").valueOf()

      members = switcherFn(op, {
        add: () => uniq(pubkeys.concat(members)),
        remove: () => without(pubkeys, members),
        set: () => pubkeys,
        default: () => members,
      })
    }

    groups.key(address).merge({members, recent_member_updates})
  }
})

// Membership access/exit requests

projections.addHandler(10004, (e: Event) => {
  let $session = sessions.get()[e.pubkey]

  if (!$session) {
    return
  }

  const addresses = Tags.fromEvent(e).communities().values().valueOf()

  for (const address of uniq(Object.keys($session.groups?.values || {}).concat(addresses))) {
    $session = modifyGroupStatus($session, address, e.created_at, {
      joined: addresses.includes(address),
    })
  }

  sessions.update(assoc(e.pubkey, $session))
})

const handleGroupRequest = access => (e: Event) => {
  const address = Tags.fromEvent(e).get("a")?.value()
  const adminKey = deriveAdminKeyForGroup(address)

  // Don't bother the admin with old requests
  if (adminKey.get() && e.created_at) {
    groupRequests.key(e.id).update(
      mergeRight({
        ...e,
        group: address,
        resolved: false,
      }),
    )
  }

  if (sessions.get()[e.pubkey]) {
    setGroupStatus(e.pubkey, address, e.created_at, {access})
  }
}

projections.addHandler(25, handleGroupRequest(GroupAccess.Requested))

projections.addHandler(26, handleGroupRequest(GroupAccess.None))

// All other events are messages sent to the group

projections.addGlobalHandler(
  batch(300, (events: Event[]) => {
    const userGroups = new Set(Object.values(sessions.get()).flatMap(getUserCommunities))

    for (const e of events) {
      // Publish the unwrapped event to our local relay so active subscriptions get notified
      if (e.wrap && groupSharedKeys.key(e.wrap.pubkey).exists()) {
        getExecutor([LOCAL_RELAY_URL]).publish(e)
      }

      const addresses = Tags.fromEvent(e).communities().values().valueOf()

      // Save events with communities the user is a part of to our local db
      if (addresses.some(a => userGroups.has(a))) {
        getExecutor([LOCAL_RELAY_URL]).publish(e)
      }
    }
  }),
)

// Unwrap gift wraps using known keys

projections.addHandler(1059, wrap => {
  const sk = getRecipientKey(wrap)

  if (sk) {
    nip59.get().withUnwrappedEvent(wrap, sk, rumor => {
      tracker.copy(wrap.id, rumor.id)
      projections.push(rumor)
    })
  }
})

projections.addHandler(1060, wrap => {
  const sk = getRecipientKey(wrap)

  if (sk) {
    nip59.get().withUnwrappedEvent(wrap, sk, rumor => {
      tracker.copy(wrap.id, rumor.id)
      projections.push(rumor)
    })
  }
})
