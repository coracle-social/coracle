<script lang="ts">
  import "prosemirror-gapcursor/style/gapcursor.css"

  import {commaFormat} from "hurdak"
  import {onMount} from "svelte"
  import {throttle} from "throttle-debounce"
  import {Editor} from "@tiptap/core"
  import Document from "@tiptap/extension-document"
  import History from "@tiptap/extension-history"
  import Paragraph from "@tiptap/extension-paragraph"
  import HardBreak from "@tiptap/extension-hard-break"
  import Dropcursor from "@tiptap/extension-dropcursor"
  import Gapcursor from "@tiptap/extension-gapcursor"
  import Text from "@tiptap/extension-text"
  import Image from "@tiptap/extension-image"
  import Code from "@tiptap/extension-code"
  import CodeBlock from "@tiptap/extension-code-block"
  import Youtube from "@tiptap/extension-youtube"
  import {Mention, Topic} from "src/util/tiptap"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonSuggestions from "src/app/shared/PersonSuggestions.svelte"
  import TopicSuggestions from "src/app/shared/TopicSuggestions.svelte"
  import {displayProfileByPubkey} from "src/engine"

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
    Youtube.configure({nocookie: true, width: "100%" as unknown as number}),
    Mention.configure(
      (() => {
        let suggestions

        const mapProps = props => ({term: props.query, select: id => props.command({id})})

        return {
          getLabel: displayProfileByPubkey,
          tippyOptions: {arrow: false, theme: "transparent"},
          onStart: ({target, props}) => {
            suggestions = new PersonSuggestions({target, props: mapProps(props)})
          },
          onUpdate: ({props}) => suggestions.$set(mapProps(props)),
          onKeyDown: ({event}) => suggestions.onKeyDown(event),
          onExit: () => suggestions.$destroy(),
        }
      })(),
    ),
    Topic.configure(
      (() => {
        let suggestions

        const mapProps = props => ({term: props.query, select: id => props.command({id})})

        return {
          tippyOptions: {arrow: false, theme: "transparent"},
          onStart: ({target, props}) => {
            suggestions = new TopicSuggestions({target, props: mapProps(props)})
          },
          onUpdate: ({props}) => suggestions.$set(mapProps(props)),
          onKeyDown: ({event}) => suggestions.onKeyDown(event),
          onExit: () => suggestions.$destroy(),
        }
      })(),
    ),
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
