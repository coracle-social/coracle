import {Node, nodePasteRule} from "@tiptap/core"
import type {Node as ProsemirrorNode} from "@tiptap/pm/model"
import type {MarkdownSerializerState} from "prosemirror-markdown"
import {createPasteRuleMatch} from "@lib/tiptap/util"

export const TOPIC_REGEX = /(?:^|\s)(#[^\s]+)/g

export interface TopicAttributes {
  name: string
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    topic: {
      insertTopic: (options: {name: string}) => ReturnType
    }
  }
}

export const TopicExtension = Node.create({
  atom: true,
  name: "topic",
  group: "inline",
  inline: true,
  selectable: true,
  draggable: true,
  priority: 1000,
  addAttributes() {
    return {
      name: {default: null},
    }
  },
  renderText(props) {
    return "#" + props.node.attrs.name
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProsemirrorNode) {
          state.write(node.attrs.name)
        },
        parse: {},
      },
    }
  },
  addCommands() {
    return {
      insertTopic:
        ({name}) =>
        ({commands}) => {
          return commands.insertContent(
            {type: this.name, attrs: {name}},
            {
              updateSelection: false,
            },
          )
        },
    }
  },
  addPasteRules() {
    return [
      nodePasteRule({
        type: this.type,
        getAttributes: match => match.data,
        find: text => {
          const matches = []

          for (const match of text.matchAll(TOPIC_REGEX)) {
            try {
              matches.push(createPasteRuleMatch(match, {name: match[0]}))
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
