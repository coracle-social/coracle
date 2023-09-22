import {collection} from "src/engine/core/utils"
import type {Topic} from "./model"

export const topics = collection<Topic>("name")
