import type {SvelteComponent, ComponentType} from "svelte"
import type {Readable} from "svelte/store"
import type {Instance} from "tippy.js"
import tippy from "tippy.js"
import {nprofileEncode} from "nostr-tools/nip19"
import type {Editor} from "svelte-tiptap"
import {PluginKey} from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"
import Suggestions from "../components/Suggestions.svelte"
import SuggestionString from "../components/SuggestionString.svelte"

export type TippySuggestionOptions = {
  char: string
  name: string
  editor: Editor
  search: Readable<(term: string) => string[]>
  select: (value: string, props: any) => void
  allowCreate?: boolean
  wrapper?: ComponentType
  component?: ComponentType
}

export const TippySuggestion = ({
  char,
  name,
  editor,
  search,
  select,
  allowCreate,
  wrapper = Suggestions,
  component = SuggestionString,
}: TippySuggestionOptions) =>
  Suggestion({
    char,
    editor,
    pluginKey: new PluginKey(`suggest-${name}`),
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
          {type: name, attrs: props},
          {type: "text", text: " "},
        ])
        .run()

      window.getSelection()?.collapseToEnd()
    },
    allow: ({state, range}) => {
      const $from = state.doc.resolve(range.from)
      const type = state.schema.nodes[name]

      return !!$from.parent.type.contentMatch.matchType(type)
    },
    render: () => {
      let popover: Instance[]
      let suggestions: SvelteComponent

      const mapProps = (props: any) => ({
        term: props.query,
        search,
        component,
        allowCreate,
        select: (value: string) => select(value, props),
      })

      return {
        onStart: props => {
          const target = document.createElement("div")

          // @ts-ignore
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

          suggestions = new wrapper({target, props: mapProps(props)})
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

export type MentionSuggestionOptions = Partial<TippySuggestionOptions> & {
  editor: Editor
  search: Readable<(term: string) => string[]>
  getRelays: (pubkey: string) => string[]
}

export const MentionSuggestion = (options: MentionSuggestionOptions) =>
  TippySuggestion({
    char: "@",
    name: "nprofile",
    select: (pubkey: string, props: any) => {
      const relays = options.getRelays(pubkey)
      const nprofile = nprofileEncode({pubkey, relays})

      return props.command({pubkey, relays, nprofile})
    },
    ...options,
  })
