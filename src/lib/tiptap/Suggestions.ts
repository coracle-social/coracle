import type {SvelteComponent, ComponentType} from 'svelte'
import type {Readable} from 'svelte/store'
import tippy, {type Instance} from 'tippy.js'
import {mergeAttributes, Node} from '@tiptap/core'
import {PluginKey} from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import type {Search} from '@lib/util'

export type SuggestionsOptions = {
  char: string,
  search: Readable<Search<any, any>>
  select: (value: any, props: any) => void
  suggestionComponent: ComponentType
  suggestionsComponent: ComponentType
}

export const createSuggestions = (name: string) =>
  Node.create<SuggestionsOptions>({
    name,
    atom: true,
    inline: true,
    group: 'inline',
    selectable: false,
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
          pluginKey: new PluginKey(name),
          editor: this.editor,
          char: this.options.char,
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
            let suggestions: SvelteComponent

            const mapProps = (props: any) => ({
              term: props.query,
              search: this.options.search,
              component: this.options.suggestionComponent,
              select: (value: string) => this.options.select(value, props),
            })

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
                })

                suggestions = new this.options.suggestionsComponent({target, props: mapProps(props)})
              },
              onUpdate: props => {
                suggestions.$set(mapProps(props))

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

                return Boolean(suggestions.onKeyDown?.(props.event))
              },
              onExit: () => {
                popover[0].destroy()
                suggestions.$destroy()
              },
            }
          },
        }),
      ]
    },
  })
