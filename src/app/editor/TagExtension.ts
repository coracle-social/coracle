import type {InputRuleMatch} from "@tiptap/core"
import {Mark, markPasteRule, mergeAttributes} from "@tiptap/core"
import {last} from "ramda"

export interface TagAttributes {
  tag: string
}

const REGEX_TAG_PASTE = /(#\p{L}[\p{L}\p{N}_]*)(?=\s)/gu
const REGEX_TAG_INPUT = /(#\p{L}[\p{L}\p{N}_]*)(?=\s)/gu

export const TagExtension = Mark.create({
  atom: true,
  name: "tag",
  group: "inline",
  inline: true,
  selectable: true,
  inclusive: false,
  priority: 1000,

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: "",
          close: "",
          mixable: false,
          expelEnclosingWhitespace: true,
        },
        parse: {},
      },
    }
  },

  renderHTML(p) {
    return ["a", mergeAttributes(p.HTMLAttributes, {"data-type": this.name})]
  },

  parseHTML() {
    return [{tag: `a[data-type="${this.name}"]`}]
  },

  addAttributes() {
    return {
      tag: {default: null},
    }
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: REGEX_TAG_PASTE,
        getAttributes: match => ({tag: match[0]}),
        type: this.type,
      }),
    ]
  },

  addInputRules() {
    return [
      {
        find: text => {
          const match = last(Array.from(text.matchAll(REGEX_TAG_INPUT)))
          if (match && text.length === match.index + match[0].length + 1) {
            return {
              index: match?.index,
              text: match[0],
              data: {tag: match[1]},
            } as InputRuleMatch
          }
          return null
        },
        handler: ({state, range, match}) => {
          const newTr = state.tr.addMark(range.from - 1, range.to, this.type.create(match.data))
          if (last(match.input) === "\n") {
            newTr.split(range.to)
          } else {
            newTr.insertText(" ")
          }
        },
      },
    ]
  },
})
