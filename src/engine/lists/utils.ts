import {fuzzy} from "src/util/misc"
import type {List} from "./model"
import {_lists} from "./state"

export const displayList = (list: List) => list?.title || "[no name]"

export const displayListByAddress = (address: string) => displayList(_lists.key(address).get())

export const getListSearch = ($lists: List[]): ((term: string) => List[]) => {
  return fuzzy($lists, {keys: ["title", "description"]})
}
