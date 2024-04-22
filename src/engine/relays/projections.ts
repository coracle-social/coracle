import {Tags} from "@welshman/util"
import {normalizeRelayUrl, isShareableRelayUrl} from "@welshman/util"
import {warn} from "src/util/logger"
import {projections} from "src/engine/core/projections"
import {RelayMode} from "./model"
import {saveRelay, saveRelayPolicy} from "./commands"

projections.addHandler(2, e => {
  saveRelay(normalizeRelayUrl(e.content))
})

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
