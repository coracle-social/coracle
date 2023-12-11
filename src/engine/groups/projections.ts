import {uniq, mergeRight, assoc} from "ramda"
import {Tags} from "paravel"
import {updateIn} from "hurdak"
import {getPublicKey} from "nostr-tools"
import {Naddr, LOCAL_RELAY_URL} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {selectHints} from "src/engine/relays/utils"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {getExecutor, getIdFilters, load} from "src/engine/network/utils"
import {GroupAccess, MemberAccess} from "./model"
import {groups, groupSharedKeys, groupAdminKeys, groupRequests, groupAlerts} from "./state"
import {deriveAdminKeyForGroup, getRecipientKey} from "./utils"
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
      members: [],
      ...$key,
    }))

    // Load the group's metadata and posts
    load({
      relays: selectHints(relays),
      filters: [
        ...getIdFilters([address]),
        {kinds: [1059], "#p": [pubkey]},
        {kinds: [1059], authors: [pubkey]},
      ],
    })
  }

  if (relays.length > 0) {
    const {identifier: id, pubkey} = Naddr.fromTagValue(address)

    groups.key(address).update($group => ({address, pubkey, id, relays, ...$group}))
  }

  groupAlerts.key(e.id).set({
    ...e,
    group: address,
    type: privkey ? "invite" : "exit",
  })

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

  if (group.get()?.updated_at > e.created_at) {
    return
  }

  group.set({
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

  const sharedKey = groupSharedKeys.key(e.wrap.pubkey)

  if (sharedKey.exists()) {
    // Publish the unwrapped event to our local relay so active subscriptions get notified
    getExecutor([LOCAL_RELAY_URL]).publish(e)

    sharedKey.update(
      updateIn("members", (members?: string[]) => uniq([...(members || []), e.pubkey])),
    )
  }
})

// Unwrap gift wraps using known keys

projections.addHandler(EventKind.GiftWrap, wrap => {
  const sk = getRecipientKey(wrap)

  if (sk) {
    nip59.get().withUnwrappedEvent(wrap, sk, rumor => {
      console.log("======", rumor)
      projections.push(rumor)
    })
  }
})
