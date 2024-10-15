import {describe, expect, it} from "vitest"
import {displayList} from "../../../src/util/misc"

describe("misc utils", () => {
  describe("displayList", () => {
    it("should return an empty string when the list is empty", () => {
      const list = []
      const output = displayList(list)

      expect(output).toEqual("")
    })

    it("should return a single entry when list length is one", () => {
      const list = ["Apple"]
      const output = displayList(list)

      expect(output).toEqual("Apple")
    })

    it("should return a string of both items when the list length is two", () => {
      const list = ["Apple", "Banana"]
      const output = displayList(list)

      expect(output).toEqual("Apple and Banana")
    })

    it("should return a string of all items when the list length is three", () => {
      const list = ["Apple", "Banana", "Cherry"]
      const output = displayList(list)

      expect(output).toEqual("Apple, Banana, and Cherry")
    })

    it("should return a truncated string of all items when the list is long", () => {
      const list = [
        "Apple",
        "Banana",
        "Orange",
        "Pear",
        "Grapes",
        "Mango",
        "Pineapple",
        "Kiwi",
        "Strawberry",
        "Blueberry",
      ]
      const output = displayList(list)

      expect(output).toEqual("Apple, Banana, Orange, Pear, Grapes, Mango, and 4 others")
    })

    it("should return a string of both items with list of two numbers", () => {
      const list = [7, 17]
      const output = displayList(list)

      expect(output).toEqual("7 and 17")
    })
  })
})
