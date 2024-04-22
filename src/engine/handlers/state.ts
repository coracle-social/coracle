import {collection} from "@welshman/lib"
import type {Handler, HandlerRec} from "./model"

export const handlers = collection<Handler>("address")
export const handlerRecs = collection<HandlerRec>("address")
