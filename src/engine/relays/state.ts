import {collection} from "@coracle.social/lib"
import type {Relay} from "./model"

export const relays = collection<Relay>("url")
