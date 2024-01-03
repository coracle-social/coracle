import {uniq, whereEq, sortBy, prop, without, mergeRight, assoc} from "ramda"
import {Tags} from "paravel"
import {switcherFn} from "hurdak"
import {Naddr, LOCAL_RELAY_URL, getPublicKey} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {selectHints} from "src/engine/relays/utils"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {getExecutor, getIdFilters, load} from "src/engine/network/utils"
import {GroupAccess, MemberAccess} from "./model"
import {groups, groupSharedKeys, groupAdminKeys, groupRequests, groupAlerts} from "./state"
import {deriveAdminKeyForGroup, getRecipientKey, deriveGroupStatus} from "./utils"
import {modifyGroupStatus, setGroupStatus} from "./commands"

// Key sharing

projections.addHandler(24, (e: Event) => {
  const tags = Tags.from(e)
  const privkey = tags.getValue("privkey")
  const address = tags.getValue("a")
  const recipient = Tags.from(e.wrap).getValue("p")
  const relays = tags.type("relay").values().all()

  if (!address) {
    return
  }

  if (privkey) {
    const pubkey = getPublicKey(privkey)
    const role = tags.getValue("role")
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
    if (deriveGroupStatus(address).get()?.access !== MemberAccess.Granted) {
      groupAlerts.key(e.id).set({...e, group: address, type: "invite"})
    }

    // Load the group's metadata and posts
    load({
      relays: selectHints(relays),
      filters: [
        ...getIdFilters([address]),
        {kinds: [1059], "#p": [pubkey]},
        {kinds: [1059], authors: [pubkey]},
      ],
    })
  } else {
    groupAlerts.key(e.id).set({...e, group: address, type: "exit"})
  }

  if (relays.length > 0) {
    const {identifier: id, pubkey} = Naddr.fromTagValue(address)

    groups.key(address).update($group => ({address, pubkey, id, relays, ...$group}))
  }

  setGroupStatus(recipient, address, e.created_at, {
    access: privkey ? MemberAccess.Granted : MemberAccess.Revoked,
  })
})

// Group metadata

projections.addHandler(34550, (e: Event) => {
  const tags = Tags.from(e)
  const meta = tags.getDict()
  const address = Naddr.fromEvent(e).asTagValue()
  const group = groups.key(address)
  const $group = group.get()

  if ($group?.updated_at > e.created_at) {
    return
  }

  group.set({
    ...$group,
    address,
    id: meta.d,
    pubkey: e.pubkey,
    updated_at: e.created_at,
    access: meta.access || GroupAccess.Open,
    relays: tags.type("relay").values().all(),
    name: meta.name,
    image: meta.image,
    description: meta.description,
    moderators: tags.mark("moderator").values().all(),
  })
})

// Public community membership

projections.addHandler(10004, (e: Event) => {
  let $session = sessions.get()[e.pubkey]

  if (!$session) {
    return
  }

  const addresses = Tags.from(e).communities().all()

  for (const address of uniq(Object.keys($session.groups || {}).concat(addresses))) {
    $session = modifyGroupStatus($session, address, e.created_at, {
      joined: addresses.includes(address),
    })
  }

  sessions.update(assoc(e.pubkey, $session))
})

projections.addHandler(27, (e: Event) => {
  const address = Tags.from(e).communities().first()
  let {members = [], recent_member_updates = []} = groups.key(address).get() || {}

  // Only replay updates if we have something new
  if (!recent_member_updates.find(whereEq({id: e.id}))) {
    recent_member_updates = sortBy(prop("created_at"), recent_member_updates.concat(e)).slice(-100)

    for (const event of recent_member_updates) {
      const op = Tags.from(event).type("op").values().first()
      const pubkeys = Tags.from(event).type("p").values().all()

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

const handleGroupRequest = access => (e: Event) => {
  const address = Tags.from(e).getValue("a")
  const adminKey = deriveAdminKeyForGroup(address)

  if (adminKey.get()) {
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

projections.addHandler(25, handleGroupRequest(MemberAccess.Requested))

projections.addHandler(26, handleGroupRequest(MemberAccess.None))

// All other events are messages sent to the group

projections.addGlobalHandler((e: Event) => {
  if (!e.wrap) {
    return
  }

  // Publish the unwrapped event to our local relay so active subscriptions get notified
  if (groupSharedKeys.key(e.wrap.pubkey).exists()) {
    getExecutor([LOCAL_RELAY_URL]).publish(e)
  }
})

// Unwrap gift wraps using known keys

projections.addHandler(EventKind.GiftWrap, wrap => {
  const sk = getRecipientKey(wrap)

  if (sk) {
    nip59.get().withUnwrappedEvent(wrap, sk, rumor => {
      projections.push(rumor)
    })
  }
})
