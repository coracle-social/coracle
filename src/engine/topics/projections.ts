import {Tags} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {addTopic, processTopics} from "./commands"

projections.addHandler(EventKind.Note, processTopics)

projections.addHandler(EventKind.ChannelMessage, processTopics)

projections.addHandler(EventKind.Label, (e: Event) => {
  for (const name of Tags.from(e).type("l").mark("#t").values().all()) {
    addTopic(e, name)
  }
})
