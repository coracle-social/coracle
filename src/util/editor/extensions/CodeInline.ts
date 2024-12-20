import {InputRule, mergeAttributes, Node, PasteRule} from "@tiptap/core"
import type {CodeOptions} from "@tiptap/extension-code"

const inputRegex = /(?:^|\s)(`(?!\s+`)((?:[^`]+))`(?!\s+`))$/

const pasteRegex = /(?:^|\s)(`(?!\s+`)((?:[^`]+))`(?!\s+`))/g

export type CodeInlineOptions = object

export const CodeInline = Node.create<CodeOptions>({
  name: "codeInline",
  content: "text*",
  marks: "",
  group: "inline",
  inline: true,
  code: true,
  defining: true,
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },
  parseHTML() {
    return [{tag: "code"}]
  },
  renderHTML({HTMLAttributes}) {
    return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
  addKeyboardShortcuts() {
    return {
      // remove code block when at start of document or code block is empty
      Backspace: () => {
        const {empty, $anchor, $from} = this.editor.state.selection

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false
        }

        if (isAtEnd) {
          const {tr} = this.editor.state
          tr.delete($from.start(), $from.end() + 1)
          this.editor.view.dispatch(tr)
        }

        return false
      },
    }
  },
  addInputRules() {
    return [
      new InputRule({
        find: inputRegex,
        handler: ({state, range, match}) => {
          const textNode = state.schema.text(match[2])
          const codeNode = this.type.create(null, textNode)
          state.tr.replaceWith(range.from, range.to, codeNode).insertText(" ")
        },
      }),
    ]
  },
  addPasteRules() {
    return [
      new PasteRule({
        find: pasteRegex,
        handler: ({state, range, match}) => {
          const textNode = state.schema.text(match[2])
          const codeNode = this.type.create(null, textNode)
          state.tr.replaceWith(range.from, range.to, codeNode).insertText(" ")
        },
      }),
    ]
  },
})
