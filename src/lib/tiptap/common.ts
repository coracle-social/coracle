import tippy, {type Instance} from 'tippy.js'
import {mergeAttributes, Node} from '@tiptap/core'
import {PluginKey} from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'

export type PopoverOptions = {
  tippyOptions: Record<string, any>
  getLabel?: (id: string) => string
  onStart?: (opts: any) => void
  onUpdate?: (opts: any) => void
  onKeyDown?: (opts: any) => boolean | undefined
  onExit?: () => void
}

export const createPopoverNode = (name: string, char: string) => {
  const pluginKey = new PluginKey(name)

  return Node.create<PopoverOptions>({
    name,
    group: 'inline',
    inline: true,
    selectable: false,
    atom: true,
    addAttributes: () => ({
      id: {
        default: null,
        parseHTML: el => el.getAttribute('data-id'),
        renderHTML: ({id}) => id ? {'data-id': id} : {},
      },
    }),
    parseHTML() {
      return [{tag: `span[data-type="${this.name}"]`}]
    },
    renderHTML({node, HTMLAttributes}) {
      const label = this.options.getLabel?.(node.attrs.id) || node.attrs.id

      return ['span', mergeAttributes({'data-type': this.name}, HTMLAttributes), `${char}${label}`]
    },
    renderText({node}) {
      return `${char}${this.options.getLabel?.(node.attrs.id) || node.attrs.id}`
    },
    addKeyboardShortcuts() {
      return {
        Backspace: () => this.editor.commands.command(({ tr, state }) => {
          let isMention = false
          const { selection } = state
          const { empty, anchor } = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              tr.insertText('', pos, pos + node.nodeSize)

              return false
            }
          })

          return isMention
        }),
      }
    },
    addProseMirrorPlugins() {
      return [
        Suggestion({
          char,
          pluginKey,
          editor: this.editor,
          command: ({editor, range, props}) => {
            // increase range.to by one when the next node is of type "text"
            // and starts with a space character
            const nodeAfter = editor.view.state.selection.$to.nodeAfter
            const overrideSpace = nodeAfter?.text?.startsWith(' ')

            if (overrideSpace) {
              range.to += 1
            }

            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {type: this.name, attrs: props},
                {type: 'text', text: ' '},
              ])
              .run()

            window.getSelection()?.collapseToEnd()
          },
          allow: ({ state, range }) => {
            const $from = state.doc.resolve(range.from)
            const type = state.schema.nodes[this.name]
            const allow = !!$from.parent.type.contentMatch.matchType(type)

            return allow
          },
          render: () => {
            let popover: Instance[]
            let target: HTMLElement

            return {
              onStart: props => {
                target = document.createElement("div")

                popover = tippy('body', {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: document.body,
                  content: target,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  ...this.options.tippyOptions,
                })

                this.options.onStart?.({target, props})
              },
              onUpdate: props => {
                this.options.onUpdate?.({props})

                if (props.clientRect) {
                  popover[0].setProps({
                    getReferenceClientRect: props.clientRect as any,
                  })
                }
              },
              onKeyDown: props => {
                if (props.event.key === "Escape") {
                  popover[0].hide()

                  return true
                }

                return Boolean(this.options.onKeyDown?.(props))
              },
              onExit: () => {
                popover[0].destroy()
                this.options.onExit?.()
              },
            }
          },
        }),
      ]
    },
  })
}
