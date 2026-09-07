import {describe, expect, it} from "vitest"
import type {TrustedEvent} from "@welshman/util"
import {sortEventsDesc, tagEventForComment} from "../../../../src/engine/utils"
import {getTestTrustedEvent} from "../../../utils/fake"

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

  describe("tagEventForComment", () => {
    it("should scope a comment on a root note to that note", () => {
      const parent = getTestTrustedEvent({id: "parentid", pubkey: "parentpubkey"})
      const tags = tagEventForComment(parent)

      expect(tags).toContainEqual(["K", "1"])
      expect(tags).toContainEqual(["P", "parentpubkey", ""])
      expect(tags).toContainEqual(["E", "parentid", "", "parentpubkey"])
      expect(tags).toContainEqual(["k", "1"])
      expect(tags).toContainEqual(["p", "parentpubkey", ""])
      expect(tags).toContainEqual(["e", "parentid", "", "parentpubkey"])
    })

    it("should scope a comment on a legacy reply to the root of the thread", () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [
          ["e", "rootid", "wss://root.example.com/", "root", "rootpubkey"],
          ["e", "grandparentid", "wss://grandparent.example.com/", "reply", "grandparentpubkey"],
        ],
      })
      const tags = tagEventForComment(parent)

      expect(tags).toContainEqual(["K", "1"])
      expect(tags).toContainEqual(["P", "rootpubkey", ""])
      expect(tags).toContainEqual(["E", "rootid", "wss://root.example.com/", "rootpubkey"])
      expect(tags).toContainEqual(["e", "parentid", "", "parentpubkey"])
      expect(tags.filter(t => t[0] === "E")).toHaveLength(1)
    })

    it("should scope a comment on a direct legacy reply to the root of the thread", () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        pubkey: "parentpubkey",
        tags: [["e", "rootid", "wss://root.example.com/", "root", "rootpubkey"]],
      })
      const tags = tagEventForComment(parent)

      expect(tags).toContainEqual(["E", "rootid", "wss://root.example.com/", "rootpubkey"])
      expect(tags).toContainEqual(["e", "parentid", "", "parentpubkey"])
    })

    it("should scope a comment on an addressable event to that event", () => {
      const parent = getTestTrustedEvent({
        id: "parentid",
        kind: 30023,
        pubkey: "parentpubkey",
        tags: [["d", "my-article"]],
      })
      const tags = tagEventForComment(parent)

      expect(tags).toContainEqual(["K", "30023"])
      expect(tags).toContainEqual(["E", "parentid", "", "parentpubkey"])
      expect(tags).toContainEqual(["A", "30023:parentpubkey:my-article", "", "parentpubkey"])
      expect(tags).toContainEqual(["a", "30023:parentpubkey:my-article", "", "parentpubkey"])
    })

    it("should inherit the root scope of a parent comment", () => {
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
      const tags = tagEventForComment(parent)

      expect(tags).toContainEqual(["K", "web"])
      expect(tags).toContainEqual(["I", "https://example.com/article"])
      expect(tags).toContainEqual(["k", "1111"])
      expect(tags).toContainEqual(["e", "parentid", "", "parentpubkey"])
      expect(tags.filter(t => t[0] === "E")).toHaveLength(0)
    })
  })
})
