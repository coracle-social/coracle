import {uniq, mergeRight, assoc} from "ramda"
import {Tags} from "paravel"
import {updateIn} from "hurdak"
import {getPublicKey} from "nostr-tools"
import {Naddr} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {_events} from "src/engine/events/state"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {groups, groupSharedKeys, groupRequests} from "./state"
import {deriveAdminKeyForGroup, getRecipientKey} from "./utils"
import {modifyGroupStatus, setGroupStatus} from "./commands"

// Key sharing

projections.addHandler(24, (e: Event) => {
  const tags = Tags.from(e)
  const privkey = tags.getValue("privkey")
  const address = tags.getValue("a")
  const recipient = Tags.from(e.wrap).getValue("p")

  if (!address) {
    return
  }

  if (privkey) {
    const pubkey = getPublicKey(privkey)

    groupSharedKeys.key(pubkey).update($key => ({
      pubkey,
      privkey,
      group: address,
      created_at: e.created_at,
      hints: tags.type("relay").values().all(),
      members: [],
      ...$key,
    }))
  }

  setGroupStatus(recipient, address, e.created_at, {
    access: privkey ? "granted" : "revoked",
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
    access: meta.access || "open",
    relays: tags.type("relay").values().all(),
    name: meta.name,
    image: meta.image,
    description: meta.description,
    moderators: tags.mark("moderator").values().all(),
  })
})

// Public community membership

projections.addHandler(10004, (e: Event) => {
  const addresses = Tags.from(e).type("a").values().all()

  let $session = sessions.get()[e.pubkey]

  if (!$session) {
    return
  }

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
      })
    )
  }

  if (sessions.get()[e.pubkey]) {
    setGroupStatus(e.pubkey, address, e.created_at, {access})
  }
}

projections.addHandler(25, handleGroupRequest("requested"))

projections.addHandler(26, handleGroupRequest(null))

// All other events are messages sent to the group

projections.addGlobalHandler((e: Event) => {
  if (!e.wrap) {
    return
  }

  const sharedKey = groupSharedKeys.key(e.wrap.pubkey)

  if (sharedKey.exists()) {
    _events.key(e.id).set(e)

    sharedKey.update(
      updateIn("members", (members?: string[]) => uniq([...(members || []), e.pubkey]))
    )
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
