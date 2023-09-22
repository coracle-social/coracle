import {tryJson} from "src/util/misc"
import {warn} from "src/util/logger"
import {Tags} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {RelayPolicy} from "./model"
import {RelayMode} from "./model"
import {normalizeRelayUrl, isShareableRelay} from "./utils"
import {saveRelay, saveRelayPolicy} from "./commands"

projections.addHandler(2, e => {
  saveRelay(normalizeRelayUrl(e.content))
})

projections.addHandler(3, e => {
  saveRelayPolicy(
    e,
    tryJson<RelayPolicy[]>(() => {
      return Object.entries(JSON.parse(e.content || ""))
        .filter(([url]) => isShareableRelay(url))
        .map(([url, conditions]) => {
          // @ts-ignore
          const write = ![false, "!"].includes(conditions.write)
          // @ts-ignore
          const read = ![false, "!"].includes(conditions.read)

          return {url: normalizeRelayUrl(url), write, read}
        })
    }) as RelayPolicy[]
  )
})

projections.addHandler(10002, e => {
  saveRelayPolicy(
    e,
    Tags.from(e)
      .type("r")
      .all()
      .map(([_, url, mode]) => {
        const write = !mode || mode === RelayMode.Write
        const read = !mode || mode === RelayMode.Read

        if (!write && !read) {
          warn(`Encountered unknown relay mode: ${mode}`)
        }

        return {url: normalizeRelayUrl(url), write, read}
      })
  )
})
