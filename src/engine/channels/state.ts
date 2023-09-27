import {collection} from "src/engine/core/utils"
import type {Channel} from "./model"

export const channels = collection<Channel>("id")
