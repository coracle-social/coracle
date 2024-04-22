import {collection} from "@welshman/lib"
import type {Channel} from "./model"

export const channels = collection<Channel>("id")
