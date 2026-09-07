import {describe, expect, it} from "vitest"
import {Resolver} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {Comment} from "@welshman/domain"
import {setCommentAncestors, sortEventsDesc} from "../../../../src/engine/utils"
import {getTestTrustedEvent} from "../../../utils/fake"

// Nothing here needs real relay selection, so resolve every hint to the empty string
const makeWriter = () => Comment.configure({resolver: new Resolver(() => [])}).writer()

const tagComment = (parent: TrustedEvent, getEvent?: (id: string) => TrustedEvent | undefined) =>
  setCommentAncestors(makeWriter(), parent, getEvent).renderTags()

describe("engine events utils", () => {
  describe("sortEventsDesc", () => {
    it("should return events in descending order (created_at timestamp)", () => {
      const events: TrustedEvent[] = [
        getTestTrustedEvent({created_at: 100}),
        getTestTrustedEvent({content: "I love Bitcoin!", created_at: 200}),
      ]

      const sortedEvents = sortEventsDesc(events)

      expect(sortedEvents[0].content).toEqual("I love Bitcoin!")
      expect(sortedEvents[0].created_at).toEqual(200)
    })
  })

  describe("setCommentAncestors", () => {
    it("should scope a comment on a root note to that note", async () => {
      const parent = getTestTrustedEvent({id: "parentid", pubkey: "parentpubkey"})
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["K", "1"])
      expect(tags).toContainEqual(["P", "parentpubkey", ""])
      expect(tags).toContainEqual(["E", "parentid", ""])
      expect(tags).toContainEqual(["k", "1"])
      expect(tags).toContainEqual(["p", "parentpubkey", ""])
      expect(tags).toContainEqual(["e", "parentid", ""])
    })

    it("should scope a comment on a legacy reply to the root of the thread", async () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [
          ["e", "rootid", "wss://root.example.com/", "root", "rootpubkey"],
          ["e", "grandparentid", "wss://grandparent.example.com/", "reply", "grandparentpubkey"],
        ],
      })
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["K", "1"])
      expect(tags).toContainEqual(["P", "rootpubkey", ""])
      expect(tags).toContainEqual(["E", "rootid", ""])
      expect(tags).toContainEqual(["e", "parentid", ""])
      expect(tags.filter(t => t[0] === "E")).toHaveLength(1)
    })

    it("should scope a comment on a direct legacy reply to the root of the thread", async () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [["e", "rootid", "wss://root.example.com/", "root", "rootpubkey"]],
      })
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["E", "rootid", ""])
      expect(tags).toContainEqual(["e", "parentid", ""])
    })

    it("should take the root's kind and author from the repository when the tag omits them", async () => {
      const root = getTestTrustedEvent({
        id: "rootid",
        kind: 30023,
        pubkey: "rootpubkey",
        tags: [["d", "my-article"]],
      })
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [
          ["e", "rootid", "", "root"],
          ["e", "grandparentid", "", "reply"],
        ],
      })
      const tags = await tagComment(parent, id => (id === "rootid" ? root : undefined))

      expect(tags).toContainEqual(["K", "30023"])
      expect(tags).toContainEqual(["E", "rootid", ""])
      expect(tags).toContainEqual(["P", "rootpubkey", ""])
      expect(tags).toContainEqual(["A", "30023:rootpubkey:my-article", ""])
    })

    it("should omit the root author when nothing tells us who it is", async () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [
          ["e", "rootid", "", "root"],
          ["e", "grandparentid", "", "reply"],
        ],
      })
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["E", "rootid", ""])
      expect(tags.filter(t => t[0] === "P")).toHaveLength(0)
    })

    it("should scope a comment on an addressable event to that event", async () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        kind: 30023,
        pubkey: "parentpubkey",
        tags: [["d", "my-article"]],
      })
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["K", "30023"])
      expect(tags).toContainEqual(["E", "parentid", ""])
      expect(tags).toContainEqual(["A", "30023:parentpubkey:my-article", ""])
      expect(tags).toContainEqual(["a", "30023:parentpubkey:my-article", ""])
    })

    it("should inherit the root scope of a parent comment", async () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        kind: 1111,
        pubkey: "parentpubkey",
        tags: [
          ["K", "web"],
          ["I", "https://example.com/article"],
          ["k", "1111"],
          ["i", "https://example.com/article"],
        ],
      })
      const tags = await tagComment(parent)

      expect(tags).toContainEqual(["K", "web"])
      expect(tags).toContainEqual(["I", "https://example.com/article"])
      expect(tags).toContainEqual(["k", "1111"])
      expect(tags).toContainEqual(["e", "parentid", ""])
      expect(tags.filter(t => t[0] === "E")).toHaveLength(0)
    })
  })
})
