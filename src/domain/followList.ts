import {FOLLOWS} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {tryJson} from "src/util/misc"

export type FollowList = {
  publicTags: string[][]
  privateTags: string[][]
  event?: TrustedEvent
}

export const makeFollowList = (followList: Partial<FollowList> = {}): FollowList => ({
  publicTags: [],
  privateTags: [],
  ...followList,
})

export const readFollowList = (event: TrustedEvent) => {
  const getPTags = tags =>
    Array.isArray(tags) ? tags.filter(t => t[0] === "p" && t[1]?.length === 64) : []

  const privateTags = getPTags(tryJson(() => JSON.parse(event.content)))
  const publicTags = getPTags(event.tags)

  return {event, publicTags, privateTags} as FollowList
}

export const createFollowList = ({publicTags = [], privateTags = []}: FollowList) => ({
  kind: FOLLOWS,
  content: JSON.stringify(privateTags),
  tags: publicTags,
})

export const editFollowList = (followList: FollowList) => {
  const addPTags = (oldTags, newTags) =>
    Array.isArray(oldTags) ? oldTags.filter(t => t !== "p").concat(newTags) : newTags

  const privateTags = addPTags(
    tryJson(() => JSON.parse(followList.event.content)) || [],
    followList.privateTags,
  )

  const publicTags = addPTags(followList.event.tags, followList.publicTags)

  return {
    kind: FOLLOWS,
    content: JSON.stringify(privateTags),
    tags: publicTags,
  }
}
