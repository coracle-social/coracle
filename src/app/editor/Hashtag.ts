import {Node, mergeAttributes} from "@tiptap/core"
import Suggestion, {type SuggestionOptions} from "@tiptap/suggestion"
import {topicSearch} from "@welshman/app"
import {PluginKey} from "prosemirror-state"
import type {SvelteComponent} from "svelte"
import tippy, {type Instance} from "tippy.js"
import Suggestions from "src/app/editor/Suggestions.svelte"
import HashtagComponent from "src/app/editor/Hashtag.svelte"

export type HashtagOptions = {
  HTMLAttributes: Record<string, any>
  suggestion: Omit<SuggestionOptions, "editor">
}

export const HashtagPluginKey = new PluginKey("hashtag")

export const Hashtag = Node.create<HashtagOptions>({
  name: "tag",

  addOptions: () => {
    return {
      HTMLAttributes: {"data-type": "tag"},
      suggestion: {
        char: "#",
        pluginKey: HashtagPluginKey,
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
              {
                type: "tag",
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run()
        },
        allow: ({editor, range}) => {
          return true
        },
        render() {
          let popover: Instance[]
          let suggestions: SvelteComponent
          const mapProps = (props: any) => ({
            term: props.query,
            search: topicSearch,
            component: HashtagComponent,
            allowCreate: true,
            select: (value: string) => {
              props.command({label: value})
            },
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
              suggestions = new Suggestions({target, props: mapProps(props)})
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
      },
    }
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute("data-id"),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }

          return {
            "data-id": attributes.id,
          }
        },
      },

      label: {
        default: null,
        parseHTML: element => element.getAttribute("data-label"),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            "data-label": attributes.label,
          }
        },
      },
    }
  },

  renderHTML({node, HTMLAttributes}) {
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      "#" + node.attrs.label,
    ]
  },

  renderText({node}) {
    return "#" + node.attrs.label
  },

  parseHTML() {
    return [
      {
        tag: `a[data-type="${this.name}"]`,
      },
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({tr, state}) => {
          let isMention = false
          const {selection} = state
          const {empty, anchor} = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              tr.insertText(this.options.suggestion.char || "", pos, pos + node.nodeSize)

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
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
