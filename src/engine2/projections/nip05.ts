import {tryFunc, Fetch} from "hurdak"
import {tryJson} from "src/util/misc"
import {people} from "src/engine2/state"
import {dufflepud} from "src/engine2/queries"
import {projections, updateStore} from "src/engine2/projections/core"

projections.addHandler(0, e => {
  tryJson(async () => {
    const {nip05: address} = JSON.parse(e.content)

    if (!address) {
      return
    }

    const profile = await tryFunc(() => Fetch.postJson(dufflepud("handle/info"), {handle: address}))

    if (profile?.pubkey === e.pubkey) {
      updateStore(people.key(e.pubkey), e.created_at, {
        handle: {
          profile,
          address,
        },
      })
    }
  })
})
