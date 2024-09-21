import {describe, expect, it} from "vitest"
import type {TrustedEvent} from "@welshman/util"
import {sortEventsAsc, sortEventsDesc} from "../../../../src/engine/utils"
import {getTestTrustedEvent} from "../../../utils/fake"

describe("engine events utils", () => {
  describe("sortEventsAsc", () => {
    it("should return events in ascending order (create_at timestamp)", () => {
      const events: TrustedEvent[] = [
        getTestTrustedEvent({created_at: 200}),
        getTestTrustedEvent({content: "I love Bitcoin!", created_at: 100}),
      ]

      const sortedEvents = sortEventsAsc(events)

      expect(sortedEvents[0].content).toEqual("I love Bitcoin!")
      expect(sortedEvents[0].created_at).toEqual(100)
    })
  })

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
})
