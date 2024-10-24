import {last} from "@welshman/lib"
import {Node, InputRule, nodePasteRule} from "@tiptap/core"
import type {Node as ProsemirrorNode} from "@tiptap/pm/model"
import type {MarkdownSerializerState} from "prosemirror-markdown"
import {createPasteRuleMatch} from "./util"

export const LINK_REGEX =
  /([a-z\+:]{2,30}:\/\/)?[^<>\(\)\s]+\.[a-z]{2,6}[^\s]*[^<>"'\.!?,:\s\)\(]*/gi

export interface LinkAttributes {
  url: string
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineLink: {
      insertLink: (options: {url: string}) => ReturnType
    }
  }
}

export const LinkExtension = Node.create({
  atom: true,
  name: "inlineLink",
  group: "inline",
  inline: true,
  selectable: true,
  draggable: true,
  priority: 1000,
  addAttributes() {
    return {
      url: {default: null},
    }
  },
  renderHTML(props) {
    return ["div", {"data-url": props.node.attrs.url}]
  },
  renderText(props) {
    return props.node.attrs.url
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProsemirrorNode) {
          state.write(node.attrs.url)
        },
        parse: {},
      },
    }
  },
  addCommands() {
    return {
      insertLink:
        ({url}) =>
        ({commands}) => {
          return commands.insertContent(
            {type: this.name, attrs: {url}},
            {
              updateSelection: false,
            },
          )
        },
    }
  },
  addInputRules() {
    return [
      new InputRule({
        find: text => {
          const match = last(Array.from(text.matchAll(LINK_REGEX)))

          if (match && text.length === match.index + match[0].length + 1) {
            return {
              index: match.index!,
              text: match[0],
              data: {
                url: match[0],
              },
            }
          }

          return null
        },
        handler: ({state, range, match}) => {
          const {tr} = state

          if (match[0]) {
            try {
              tr.insert(range.from - 1, this.type.create(match.data))
                .delete(tr.mapping.map(range.from - 1), tr.mapping.map(range.to))
                .insert(
                  tr.mapping.map(range.to),
                  this.editor.schema.text(last(Array.from(match.input!))),
                )
            } catch (e) {
              // If the node was already linkified, the above code breaks for whatever reason
            }
          }

          tr.scrollIntoView()
        },
      }),
    ]
  },
  addPasteRules() {
    return [
      nodePasteRule({
        type: this.type,
        getAttributes: match => match.data,
        find: text => {
          const matches = []

          for (const match of text.matchAll(LINK_REGEX)) {
            try {
              matches.push(createPasteRuleMatch(match, {url: match[0]}))
            } catch (e) {
              continue
            }
          }

          return matches
        },
      }),
    ]
  },
})
