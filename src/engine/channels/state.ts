import {collection} from "@coracle.social/lib"
import type {Channel} from "./model"

export const channels = collection<Channel>("id")
