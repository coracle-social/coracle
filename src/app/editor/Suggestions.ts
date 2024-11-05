import type {SvelteComponent, ComponentType} from "svelte"
import type {Readable} from "svelte/store"
import tippy, {type Instance} from "tippy.js"
import type {Editor} from "@tiptap/core"
import {PluginKey} from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"
import type {Search} from "@welshman/app"

export type SuggestionsOptions = {
  char: string
  name: string
  editor: Editor
  search: Readable<Search<any, any>>
  select: (value: any, props: any) => void
  allowCreate?: boolean
  suggestionComponent: ComponentType
  suggestionsComponent: ComponentType
}

export const createSuggestions = (options: SuggestionsOptions) =>
  Suggestion({
    char: options.char,
    editor: options.editor,
    pluginKey: new PluginKey(`suggest-${options.name}`),
    command: ({editor, range, props}) => {
      // increase range.to by one when the next node is of type "text"
      // and starts with a space character
      const nodeAfter = editor.view.state.selection.$to.nodeAfter
      const overrideSpace = nodeAfter?.text?.startsWith(" ")

      if (overrideSpace) {
        range.to += 1
      }

      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {type: options.name, attrs: props},
          {type: "text", text: " "},
        ])
        .run()

      window.getSelection()?.collapseToEnd()
    },
    allow: ({state, range}) => {
      const $from = state.doc.resolve(range.from)
      const type = state.schema.nodes[options.name]

      return !!$from.parent.type.contentMatch.matchType(type)
    },
    render: () => {
      let popover: Instance[]
      let suggestions: SvelteComponent

      const mapProps = (props: any) => ({
        term: props.query,
        search: options.search,
        allowCreate: options.allowCreate,
        component: options.suggestionComponent,
        select: (value: string) => options.select(value, props),
      })

      return {
        onStart: props => {
          const target = document.createElement("div")

          popover = tippy("body", {
            getReferenceClientRect: props.clientRect as any,
            appendTo: document.querySelector("dialog[open]") || document.body,
            content: target,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          })
          if (!props.query) popover[0].hide()
          suggestions = new options.suggestionsComponent({target, props: mapProps(props)})
        },
        onUpdate: props => {
          if (props.query) {
            popover[0].show()
          } else {
            popover[0].hide()
          }
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
  })
