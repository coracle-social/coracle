import {collection} from "@coracle.social/lib"
import type {Topic} from "./model"

export const topics = collection<Topic>("name")
