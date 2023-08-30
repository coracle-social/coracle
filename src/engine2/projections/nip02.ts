import {now} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {socialGraph} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

projections.addHandler(3, e => {
  const entry = socialGraph.key(e.pubkey).get()

  if (e.created_at < entry?.petnames_updated_at) {
    return
  }

  socialGraph.key(e.pubkey).merge({
    updated_at: now(),
    petnames_updated_at: e.created_at,
    petnames: Tags.from(e).type("p").all(),
  })
})

projections.addHandler(10000, e => {
  const entry = socialGraph.key(e.pubkey).get()

  if (e.created_at < entry?.mutes_updated_at) {
    return
  }

  socialGraph.key(e.pubkey).merge({
    updated_at: now(),
    mutes_updated_at: e.created_at,
    mutes: Tags.from(e).type(["e", "p"]).all(),
  })
})
