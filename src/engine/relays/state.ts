import {collection} from "@welshman/lib"
import type {Relay} from "./model"

export const relays = collection<Relay>("url")
