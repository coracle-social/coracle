import {Tags} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {updateStore} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import {getLnUrl, getZapper} from "src/engine/zaps/utils"
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
    const content = JSON.parse(e.content)

    updateStore(people.key(e.pubkey), e.created_at, {
      profile: content,
    })

    updateHandle(e, content)
    updateZapper(e, content)
  })
})

projections.addHandler(3, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    petnames: Tags.from(e).type("p").all(),
  })
})

projections.addHandler(10000, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    mutes: Tags.from(e).type(["e", "p"]).all(),
  })
})
