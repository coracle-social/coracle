import type {Instance} from "tippy.js"
import tippy from "tippy.js"
import {nprofileEncode} from "nostr-tools/nip19"
import type {Editor} from "@tiptap/core"
import {makeNProfileAttrs} from "nostr-editor"
import {PluginKey} from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"
import {throttle, enumerate, clamp} from "@welshman/lib"

export type CreateSuggestion = (item: string) => HTMLElement

export const defaultCreateSuggestion = (item: string) => {
  const span = document.createElement("span")

  span.textContent = item

  return span
}

export type SuggestionsWrapperProps = {
  term: string
  allowCreate: boolean
  select: (value: string) => void
  search: (term: string) => string[]
  createSuggestion: CreateSuggestion
}

export interface ISuggestionsWrapperConstructor {
  new (target: HTMLElement, props: SuggestionsWrapperProps): ISuggestionsWrapper
}

export interface ISuggestionsWrapper {
  setProps: (props: SuggestionsWrapperProps) => void
  onKeyDown: (event: Event) => boolean
  destroy: () => void
}

function createSuggestionsWrapper(
  ctor: ISuggestionsWrapperConstructor,
  target: HTMLElement,
  props: SuggestionsWrapperProps,
): ISuggestionsWrapper {
  return new ctor(target, props)
}

export class DefaultSuggestionsWrapper implements ISuggestionsWrapper {
  index = 0
  items: string[] = []
  target: HTMLElement
  content: HTMLElement
  props: SuggestionsWrapperProps

  constructor(target: HTMLElement, props: SuggestionsWrapperProps) {
    this.target = target
    this.props = props
    this.content = document.createElement("div")
    this.content.classList.add("tiptap-suggestions__content")

    target.appendChild(this.content)
    target.classList.add("tiptap-suggestions")

    this.search()
    this.render()
  }

  search = throttle(300, () => {
    const {term, search} = this.props

    this.items = search(term).slice(0, 5)
  })

  render() {
    const {index} = this
    const {select, term, allowCreate, createSuggestion} = this.props

    this.content.innerHTML = ""

    if (term && allowCreate && this.items.includes(term)) {
      const button = document.createElement("button")

      button.classList.add("tiptap-suggestions__create")

      button.addEventListener("mousedown", (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
      })

      button.addEventListener("click", (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
        select(term)
      })

      this.content.appendChild(button)
    }

    for (const [i, item] of enumerate(this.items)) {
      const button = document.createElement("button")

      button.classList.add("tiptap-suggestions__item")

      if (i === index) {
        button.classList.add("tiptap-suggestions__selected")
      }

      button.addEventListener("mousedown", (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
      })

      button.addEventListener("click", (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
        select(item)
      })

      button.appendChild(createSuggestion(item))

      this.content.appendChild(button)
    }
  }

  setIndex(index: number) {
    this.index = clamp([0, this.items.length - 1], index)
    this.render()
  }

  setProps(props: SuggestionsWrapperProps) {
    this.props = props
    this.search()
    this.render()
  }

  onKeyDown(event: any) {
    const {index, items} = this
    const {term, select, allowCreate} = this.props

    if (["Enter", "Tab"].includes(event.code)) {
      const value = items[index]

      if (value) {
        select(value)

        return true
      } else if (term && allowCreate) {
        select(term)

        return true
      }
    }

    if (event.code === "Space" && term && allowCreate) {
      select(term)

      return true
    }

    if (event.code === "ArrowUp") {
      this.setIndex(index - 1)

      return true
    }

    if (event.code === "ArrowDown") {
      this.setIndex(index + 1)

      return true
    }

    return false
  }

  destroy() {
    this.target.remove()
  }
}

export type TippySuggestionOptions = {
  char: string
  name: string
  editor: Editor
  search: (term: string) => string[]
  select: (value: string, props: any) => void
  allowCreate?: boolean
  createSuggestion?: CreateSuggestion
  suggestionsWrapper?: ISuggestionsWrapperConstructor
}

export const TippySuggestion = ({
  char,
  name,
  editor,
  search,
  select,
  allowCreate = false,
  createSuggestion = defaultCreateSuggestion,
  suggestionsWrapper = DefaultSuggestionsWrapper,
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
      let wrapper: ISuggestionsWrapper

      const mapProps = (props: any) => ({
        term: props.query,
        search,
        allowCreate,
        createSuggestion,
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

          wrapper = createSuggestionsWrapper(suggestionsWrapper, target, mapProps(props))
        },
        onUpdate: props => {
          if (props.query) {
            popover[0].show()
          } else {
            popover[0].hide()
          }

          wrapper.setProps(mapProps(props))

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

          return Boolean(wrapper.onKeyDown(props.event))
        },
        onExit: () => {
          popover[0].destroy()
          wrapper.destroy()
        },
      }
    },
  })

export type MentionSuggestionOptions = Partial<TippySuggestionOptions> & {
  editor: Editor
  search: (term: string) => string[]
  getRelays: (pubkey: string) => string[]
}

export const MentionSuggestion = (options: MentionSuggestionOptions) =>
  TippySuggestion({
    char: "@",
    name: "nprofile",
    select: (pubkey: string, props: any) => {
      const relays = options.getRelays(pubkey)
      const bech32 = nprofileEncode({pubkey, relays})

      return props.command(makeNProfileAttrs(bech32, {}))
    },
    ...options,
  })
