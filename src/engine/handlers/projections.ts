import {getAddress} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {projections} from "src/engine/network"
import {handlers, handlerRecs} from "./state"

projections.addHandler(31989, (event: TrustedEvent) => {
  const address = getAddress(event)

  handlerRecs.key(address).set({address, event})
})

projections.addHandler(31990, (event: TrustedEvent) => {
  const address = getAddress(event)

  handlers.key(address).set({address, event})
})
