import {fuzzy} from "src/util/misc"

export const getTopicSearch = $topics => fuzzy($topics, {keys: ["name"], threshold: 0.3})
