import {pluck} from "ramda"
import {topics} from "./state"
import {getTopicSearch} from "./utils"

export const searchTopics = topics.derived(getTopicSearch)

export const searchTopicNames = searchTopics.derived(search => term => pluck("name", search(term)))
