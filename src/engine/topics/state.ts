import {collection} from "@welshman/lib"
import type {Topic} from "./model"

export const topics = collection<Topic>("name")
