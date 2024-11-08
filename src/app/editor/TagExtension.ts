import type {InputRuleMatch} from "@tiptap/core"
import {Mark, markPasteRule, mergeAttributes} from "@tiptap/core"

export interface TagAttributes {
  tag: string
}

const REGEX_TAG_PASTE = /(#[^\W]+)(?=\s) /g
const REGEX_TAG_INPUT = /(#[^\W]+)(?=\s) /g

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
          const match = text.match(REGEX_TAG_INPUT)
          if (match && match[0] == text) {
            return {
              index: match.index,
              text: match[0],
              data: {tag: text.trim()},
              match,
            } as InputRuleMatch
          }
          return null
        },
        handler: ({state, range, match}) => {
          if (match) {
            state.tr.addMark(range.from - 1, range.to, this.type.create(match.data)).insertText(" ")
          }
        },
      },
    ]
  },
})
