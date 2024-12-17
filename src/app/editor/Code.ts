import {inputRegex, pasteRegex, type CodeOptions} from "@tiptap/extension-code"
import {
  Mark,
  markInputRule,
  mergeAttributes,
  Node,
  nodeInputRule,
  nodePasteRule,
  textblockTypeInputRule,
  textInputRule,
} from "@tiptap/core"

export const Code = Node.create<CodeOptions>({
  name: "code",

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  excludes: "_",

  code: true,

  content: "text*",

  marks: "",

  exitable: true,

  parseHTML() {
    return [{tag: "code"}]
  },

  renderHTML({HTMLAttributes, node}) {
    console.log("renderHTML", node.textContent)
    return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), node.textContent]
  },

  addCommands() {
    return {
      setCode:
        () =>
        ({commands}) => {
          return commands.setMark(this.name)
        },
      toggleCode:
        () =>
        ({commands}) => {
          return commands.toggleMark(this.name)
        },
      unsetCode:
        () =>
        ({commands}) => {
          return commands.unsetMark(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-e": () => this.editor.commands.toggleCode(),
    }
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          return {content: match[1]} // Capture content inside backticks
        },
      }),
    ]
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ]
  },
})
