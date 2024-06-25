<script lang="ts">
  import "prosemirror-gapcursor/style/gapcursor.css"

  import {commaFormat} from "hurdak"
  import {onMount} from "svelte"
  import tippy from "tippy.js"
  import {throttle} from "throttle-debounce"
  import {Editor} from "@tiptap/core"
  import Document from "@tiptap/extension-document"
  import History from '@tiptap/extension-history'
  import Paragraph from "@tiptap/extension-paragraph"
  import HardBreak from "@tiptap/extension-hard-break"
  import Dropcursor from "@tiptap/extension-dropcursor"
  import Gapcursor from '@tiptap/extension-gapcursor'
  import Text from "@tiptap/extension-text"
  import Image from "@tiptap/extension-image"
  import Code from "@tiptap/extension-code"
  import CodeBlock from "@tiptap/extension-code-block"
  import Mention from "@tiptap/extension-mention"
  import Youtube from "@tiptap/extension-youtube"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonSuggestions from "src/app/shared/PersonSuggestions.svelte"
  import {profileSearch, displayProfileByPubkey} from 'src/engine'
  import {router} from 'src/app/util'

  export let ctrl

  const updateCounts = throttle(300, () => {
    ctrl.setContent("")
  })

  const onWrapperClick = e => {
    if (e.target === element) {
      e.target.querySelector("[contenteditable]").focus()
    }
  }

  const extensions = [
    Document,
    History,
    Paragraph,
    HardBreak,
    Text,
    Image,
    Gapcursor,
    Dropcursor,
    Code,
    CodeBlock,
    Youtube.configure({nocookie: true, width: '100%'}),
    Mention.configure({
      deleteTriggerWithBackspace: true,
      suggestion: {
        render: () => {
          let popover, suggestions, target

          const mapProps = props => ({
            term: props.query,
            select: pubkey => props.command({id: pubkey, label: displayProfileByPubkey(pubkey)}),
          })

          return {
            onStart: props => {
              target = document.createElement("div")

              popover = tippy("body", {
                arrow: false,
                theme: "transparent",
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: target,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              })

              suggestions = new PersonSuggestions({target, props: mapProps(props)})
            },
            onUpdate(props) {
              suggestions.$set(mapProps(props))

              if (props.clientRect) {
                popover[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              }
            },
            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popover[0].hide()

                return true
              }

              if (props.event.key === "Enter") {
                const pubkey = suggestions.get()

                if (pubkey) {
                  suggestions.select(pubkey)
                }

                return true
              }

              return suggestions.onKeyDown(props.event)
            },
            onExit() {
              popover[0].destroy()
              suggestions.$destroy()
            },
          }
        },
      },
    }),
  ]

  let element

  onMount(() => {
    const editor = new Editor({element, extensions})
  })
</script>

<Card class="!p-0">
  <div>
    <div class="cursor-text p-6" bind:this={element} on:click={onWrapperClick} />
    <div
      class="flex items-center justify-between border-t border-solid border-neutral-600 px-6 py-2">
      <Anchor button accent class="!h-5 !text-sm">Add an image</Anchor>
      <div class="flex items-center justify-end gap-2 text-sm text-neutral-200">
        <span>{commaFormat($ctrl.counts.chars)} characters</span>
        <span>•</span>
        <span>{commaFormat($ctrl.counts.words)} words</span>
      </div>
    </div>
  </div>
</Card>
