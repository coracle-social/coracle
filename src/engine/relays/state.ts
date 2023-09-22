import {collection} from "src/engine/core/utils"
import type {Relay} from "./model"

export const relays = collection<Relay>("url")
