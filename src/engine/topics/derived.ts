import {topics} from "./state"
import {getTopicSearch} from "./utils"

export const searchTopics = topics.derived(getTopicSearch)
