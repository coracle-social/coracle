import { Node, nodePasteRule, type PasteRuleMatch } from '@tiptap/core'
import type { Node as ProsemirrorNode } from '@tiptap/pm/model'
import type { MarkdownSerializerState } from 'prosemirror-markdown'

export const LINK_REGEX = /^([a-z\+:]{2,30}:\/\/)?[^<>\(\)\s]+\.[a-z]{2,6}[^\s]*[^<>"'\.!?,:\s\)\(]*/gi

export const createPasteRuleMatch = <T extends Record<string, unknown>>(
  match: RegExpMatchArray,
  data: T,
): PasteRuleMatch => ({ index: match.index!, replaceWith: match[2], text: match[0], match, data })

export interface LinkAttributes {
  url: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    link: {
      insertLink: (options: { url: string }) => ReturnType
    }
  }
}

export const LinkExtension = Node.create({
  atom: true,
  name: 'link',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,
  priority: 1000,
  addAttributes() {
    return {
      url: { default: null },
    }
  },
  renderHTML(props) {
    return ['div', { 'data-url': props.node.attrs.url }]
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
        ({ url }) =>
        ({ commands }) => {
          return commands.insertContent(
            { type: this.name, attrs: { url } },
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
        getAttributes: (match) => match.data,
        find: (text) => {
          const matches = []

          for (const match of text.matchAll(LINK_REGEX)) {
            try {
              matches.push(createPasteRuleMatch(match, { url: match[0] }))
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
