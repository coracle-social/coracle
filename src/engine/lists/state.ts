import {collection} from "@coracle.social/lib"
import type {List} from "./model"

export const _lists = collection<List>("naddr")
