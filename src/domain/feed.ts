import {fromPairs} from '@welshman/lib'
import type {Rumor} from '@welshman/util'

export const getFeedTitle = (e: Rumor) => {
  const {title, d} = fromPairs(e.tags)

  return title || d
}

