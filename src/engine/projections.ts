import {always, max, mergeRight, pluck, prop, sortBy, uniq, uniqBy, whereEq, without} from "ramda"
import {batch, switcherFn, tryFunc} from "hurdak"
import {
  addTopic,
  modifyGroupStatus,
  saveRelayPolicy,
  setGroupStatus,
  updateRecord,
  updateStore,
} from "src/engine/commands"
import {
  deriveAdminKeyForGroup,
  deriveGroupStatus,
  getChannelId,
  getHandle,
  getRecipientKey,
  nip04,
} from "src/engine/state"
import {nth} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {
  Tags,
  Address,
  getAddress,
  getIdFilters,
  getLnUrl,
  isShareableRelayUrl,
  normalizeRelayUrl,
} from "@welshman/util"
import {warn} from "src/util/logger"
import {tryJson, updateIn} from "src/util/misc"
import {isGiftWrap, giftWrapKinds, getPublicKey} from "src/util/nostr"
import {appDataKeys} from "src/util/nostr"
import {getNip04, getNip44, getNip59} from "src/engine/utils"
import {updateSession, setSession} from "src/engine/commands"
import {
  relay,
  repository,
  channels,
  getSession,
  getZapper,
  groupAdminKeys,
  groupAlerts,
  groupRequests,
  groupSharedKeys,
  groups,
  load,
  nip59,
  people,
  projections,
  seen,
  sessions,
  tracker,
  withFallbacks,
} from "src/engine/state"
import type {Channel} from "src/engine/model"
import {GroupAccess, RelayMode} from "src/engine/model"

// Synchronize repository with projections. All events should be published to the
// repository, and when accepted, be propagated to projections. This avoids processing
// the same event multiple times, since repository deduplicates

repository.on("event", (event: TrustedEvent) => projections.push(event))

// Unwrap gift wraps and send them back to our local relay. They'll then get pushed
// back onto projections if they haven't been seen before

projections.addGlobalHandler((event: TrustedEvent) => {
  if (isGiftWrap(event)) {
    const session = getSession(Tags.fromEvent(event).get("p")?.value())

    if (session) {
      const canDecrypt =
        (event.kind === 1059 && getNip44(session).isEnabled()) ||
        (event.kind === 1060 && getNip04(session).isEnabled())

      if (canDecrypt) {
        getNip59(session).withUnwrappedEvent(event, session.privkey, rumor => {
          tracker.copy(event.id, rumor.id)
          relay.send("EVENT", rumor)
        })
      }
    }

    const sk = getRecipientKey(event)

    if (sk) {
      nip59.get().withUnwrappedEvent(event, sk, rumor => {
        tracker.copy(event.id, rumor.id)
        relay.send("EVENT", rumor)
      })
    }
  }
})

// Relay selections

projections.addHandler(10002, e => {
  saveRelayPolicy(
    e,
    Tags.fromEvent(e)
      .filter(t => ["r", "relay"].includes(t.key()) && isShareableRelayUrl(t.value()))
      .mapTo(t => {
        const [url, mode] = t.drop(1).valueOf()
        const write = !mode || mode === RelayMode.Write
        const read = !mode || mode === RelayMode.Read

        if (!write && !read) {
          warn(`Encountered unknown relay mode: ${mode}`)
        }

        return {url: normalizeRelayUrl(url), write, read}
      })
      .valueOf(),
  )
})

// Key sharing

projections.addHandler(24, (e: TrustedEvent) => {
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
      skipCache: true,
      relays: withFallbacks(relays),
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
    const {pubkey, identifier} = Address.from(address)

    if (!groups.key(address).get()) {
      groups.key(address).set({address, pubkey, id: identifier, relays})
    }
  }

  setGroupStatus(recipient, address, e.created_at, {
    access: privkey ? GroupAccess.Granted : GroupAccess.Revoked,
  })
})

// Group metadata

projections.addHandler(35834, (e: TrustedEvent) => {
  const tags = Tags.fromEvent(e)
  const meta = tags.asObject()
  const address = getAddress(e)
  const group = groups.key(address)

  group.merge({address, id: meta.d, pubkey: e.pubkey})

  updateStore(group, e.created_at, {
    feeds: tags.whereKey("feed").unwrap(),
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

projections.addHandler(34550, (e: TrustedEvent) => {
  const tags = Tags.fromEvent(e)
  const meta = tags.asObject()
  const address = getAddress(e)
  const group = groups.key(address)

  group.merge({address, id: meta.d, pubkey: e.pubkey})

  updateStore(group, e.created_at, {
    feeds: tags.whereKey("feed").unwrap(),
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

projections.addHandler(27, (e: TrustedEvent) => {
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

projections.addHandler(10004, (e: TrustedEvent) => {
  let session = getSession(e.pubkey)

  if (!session) {
    return
  }

  const addresses = Tags.fromEvent(e).communities().values().valueOf()

  for (const address of uniq(Object.keys(session.groups?.values || {}).concat(addresses))) {
    session = modifyGroupStatus(session, address, e.created_at, {
      joined: addresses.includes(address),
    })
  }

  updateSession(e.pubkey, always(session))
})

const handleGroupRequest = access => (e: TrustedEvent) => {
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

  if (getSession(e.pubkey)) {
    setGroupStatus(e.pubkey, address, e.created_at, {access})
  }
}

projections.addHandler(25, handleGroupRequest(GroupAccess.Requested))

projections.addHandler(26, handleGroupRequest(GroupAccess.None))

const updateHandle = async (e, {nip05}) => {
  if (!nip05) {
    return
  }

  const person = people.key(e.pubkey)

  if (person.get()?.handle_updated_at > e.created_at) {
    return
  }

  const profile = await getHandle(nip05)

  if (profile?.pubkey === e.pubkey) {
    updateStore(person, e.created_at, {
      handle: {address: nip05, profile},
    })
  }
}

const updateZapper = async (e, {lud16, lud06}) => {
  const address = (lud16 || lud06 || "").toLowerCase()

  if (!address) {
    return
  }

  const lnurl = getLnUrl(address)

  if (!lnurl) {
    return
  }

  const person = people.key(e.pubkey)

  if (person.get()?.zapper_updated_at > e.created_at) {
    return
  }

  const zapper = await getZapper(lnurl)

  if (!zapper?.allowsNostr || !zapper?.nostrPubkey) {
    return
  }

  updateStore(person, e.created_at, {zapper})
}

projections.addHandler(0, e => {
  tryJson(async () => {
    const session = getSession(e.pubkey)

    if (session) {
      updateSession(e.pubkey, $session => updateRecord($session, e.created_at, {kind0: e}))
    }

    const content = JSON.parse(e.content)

    updateStore(people.key(e.pubkey), e.created_at, {
      profile: content,
    })

    updateHandle(e, content)
    updateZapper(e, content)
  })
})

projections.addHandler(3, e => {
  const session = getSession(e.pubkey)

  if (session) {
    updateSession(e.pubkey, $session => updateRecord($session, e.created_at, {kind3: e}))
  }

  updateStore(people.key(e.pubkey), e.created_at, {
    petnames: Tags.fromEvent(e).whereKey("p").unwrap(),
  })
})

projections.addHandler(10000, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    mutes: Tags.fromEvent(e)
      .filter(t => ["e", "p"].includes(t.key()))
      .unwrap(),
  })
})

projections.addHandler(10002, e => {
  const session = getSession(e.pubkey)

  if (session) {
    updateSession(e.pubkey, $session => updateRecord($session, e.created_at, {kind10002: e}))
  }
})

projections.addHandler(10004, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    communities: Tags.fromEvent(e).whereKey("a").unwrap(),
  })
})

projections.addHandler(
  15,
  batch(500, (chunk: TrustedEvent[]) => {
    seen.mapStore.update($m => {
      for (const e of chunk) {
        for (const id of Tags.fromEvent(e).values("e").valueOf()) {
          $m.set(id, {id, published: e.created_at})
        }
      }

      return $m
    })
  }),
)

projections.addHandler(1, (e: TrustedEvent) => {
  const tagTopics = Tags.fromEvent(e).topics().valueOf()
  const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(nth(1))

  for (const name of tagTopics.concat(contentTopics)) {
    addTopic(e, name)
  }
})

projections.addHandler(1985, (e: TrustedEvent) => {
  for (const name of Tags.fromEvent(e)
    .whereKey("l")
    .filter(t => t.last() === "#t")
    .values()
    .valueOf()) {
    addTopic(e, name)
  }
})

projections.addHandler(30078, async e => {
  const d = Tags.fromEvent(e).get("d")?.value()
  const session = getSession(e.pubkey)

  if (!session) {
    return
  }

  const nip04 = getNip04(session)

  if (!nip04.isEnabled()) {
    return
  }

  if (d === appDataKeys.NIP24_LAST_CHECKED) {
    const payload = await tryJson(async () =>
      JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey)),
    )

    if (payload) {
      channels.mapStore.update($channels => {
        for (const [id, ts] of Object.entries(payload) as [string, number][]) {
          const channel = $channels.get(id)

          $channels.set(id, {
            relays: [],
            members: [],
            messages: [],
            ...channel,
            last_checked: Math.max(ts, channel?.last_checked || 0),
          })
        }

        return $channels
      })
    }
  }
})

const handleMessage = async e => {
  const tags = Tags.fromEvent(e)
  const pubkeys = uniq(tags.values("p").valueOf().concat(e.pubkey)) as string[]
  const channelId = getChannelId(pubkeys)

  for (const pubkey of Object.keys(sessions.get())) {
    if (!pubkeys.includes(pubkey)) {
      continue
    }

    const $channel = channels.key(channelId).get()

    const relays = $channel?.relays || []
    const messages = $channel?.messages || []

    // If we already have the message we're done
    if (messages.find(whereEq({id: e.id}))) {
      return $channel
    }

    // Handle nip04
    if (e.kind === 4) {
      const recipient = tags.get("p")?.value()
      const session = getSession(e.pubkey) || getSession(recipient)

      if (!session) {
        return
      }

      const nip04 = getNip04(session)

      if (!nip04.isEnabled()) {
        return
      }

      const other = e.pubkey === session.pubkey ? recipient : e.pubkey

      e = {...e, content: await nip04.decryptAsUser(e.content, other)}
    }

    const updates: Channel = {
      ...$channel,
      id: channelId,
      relays: uniq([...tags.relays().valueOf(), ...relays]),
      messages: uniqBy(prop("id"), [e, ...messages]),
      members: pubkeys,
    }

    if (e.pubkey === pubkey) {
      updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
    } else {
      updates.last_received = Math.max(updates.last_received || 0, e.created_at)
    }

    channels.key(channelId).set(updates)
  }
}

projections.addHandler(4, handleMessage)
projections.addHandler(14, handleMessage)

projections.addHandler(30078, async e => {
  if (Tags.fromEvent(e).get("d")?.value() === appDataKeys.USER_SETTINGS) {
    const session = getSession(e.pubkey)

    if (session) {
      const settings = await tryFunc(async () =>
        JSON.parse(await nip04.get().decryptAsUser(e.content, e.pubkey)),
      )

      if (settings) {
        setSession(e.pubkey, updateRecord(session, e.created_at, {settings}))
      }
    }
  }
})
