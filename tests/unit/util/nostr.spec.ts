import {describe, expect, it} from "vitest"
import {getListPubkeys} from "../../../src/util/nostr"

const a = "a".repeat(64)
const b = "b".repeat(64)

describe("util nostr", () => {
  describe("getListPubkeys", () => {
    it("should return the pubkeys of p tags in order", () => {
      const tags = [
        ["p", b],
        ["t", "nostr"],
        ["p", a, "wss://relay.example.com"],
      ]

      expect(getListPubkeys(tags)).toEqual([b, a])
    })

    it("should drop duplicates and malformed pubkeys", () => {
      expect(getListPubkeys([["p", a], ["p", a], ["p", "nope"], ["p"]])).toEqual([a])
    })
  })
})
