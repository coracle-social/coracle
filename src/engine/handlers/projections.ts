import {getAddress} from "paravel"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {handlers, handlerRecs} from "./state"

projections.addHandler(31989, (event: Event) => {
  const address = getAddress(event)

  handlerRecs.key(address).set({address, event})
})

projections.addHandler(31990, (event: Event) => {
  const address = getAddress(event)

  handlers.key(address).set({address, event})
})
