import {Tags} from "@welshman/util"
import {projections} from "src/engine/network"
import type {Event} from "src/engine/events/model"
import {addTopic, processTopics} from "./commands"

projections.addHandler(1, processTopics)

projections.addHandler(1985, (e: Event) => {
  for (const name of Tags.fromEvent(e)
    .whereKey("l")
    .filter(t => t.last() === "#t")
    .values()
    .valueOf()) {
    addTopic(e, name)
  }
})
