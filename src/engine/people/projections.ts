import {Tags, getLnUrl} from "@welshman/util"
import {tryJson} from "src/util/misc"
import {updateStore, updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/network"
import {getSession} from "src/engine/session/utils"
import {updateSession} from "src/engine/session/commands"
import {getZapper} from "src/engine/zaps/utils"
import {people} from "./state"
import {getHandle} from "./utils"

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
