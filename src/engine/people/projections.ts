import {uniq} from "ramda"
import {tryFunc, createMapOf, Fetch} from "hurdak"
import {Tags} from "src/util/nostr"
import {tryJson, hexToBech32, createBatcher} from "src/util/misc"
import {updateStore} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import {dufflepud} from "src/engine/session/utils"
import {getLnUrl} from "src/engine/zaps/utils"
import {people} from "./state"

const fetchHandle = createBatcher(500, async (handles: string[]) => {
  const data = await tryFunc(async () => {
    const res = await Fetch.postJson(dufflepud("handle/info"), {handles: uniq(handles)})

    return res?.data || []
  })

  const infoByHandle = createMapOf("handle", "info", data)

  return handles.map(h => infoByHandle[h])
})

const fetchZapper = createBatcher(500, async (lnurls: string[]) => {
  const data = await tryFunc(async () => {
    const res = await Fetch.postJson(dufflepud("zapper/info"), {lnurls: uniq(lnurls)})

    return res?.data || []
  })

  const infoByLnurl = createMapOf("lnurl", "info", data)

  return lnurls.map(h => infoByLnurl[h])
})

const updateHandle = async (e, {nip05}) => {
  if (!nip05) {
    return
  }

  const person = people.key(e.pubkey)

  if (person.get()?.handle_updated_at > e.created_at) {
    return
  }

  const profile = await fetchHandle(nip05)

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

  const result = await fetchZapper(lnurl)

  if (!result?.allowsNostr || !result?.nostrPubkey) {
    return
  }

  updateStore(person, e.created_at, {
    zapper: {
      lnurl: hexToBech32("lnurl", lnurl),
      callback: result.callback,
      minSendable: result.minSendable,
      maxSendable: result.maxSendable,
      nostrPubkey: result.nostrPubkey,
    },
  })
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
