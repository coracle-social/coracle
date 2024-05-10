import {Tags} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {projections} from "src/engine/network"
import {addTopic, processTopics} from "./commands"

projections.addHandler(1, processTopics)

projections.addHandler(1985, (e: TrustedEvent) => {
  for (const name of Tags.fromEvent(e)
    .whereKey("l")
    .filter(t => t.last() === "#t")
    .values()
    .valueOf()) {
    addTopic(e, name)
  }
})
