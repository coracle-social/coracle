<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {NProfileExtension, ImageExtension} from "nostr-editor"
  import {createEvent} from "@welshman/util"
  import {publishThunk, makeThunk} from "@welshman/app"
  import {findNodes} from "@lib/tiptap"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {makeMention, makeIMeta} from "@app/commands"
  import {getChatEditorOptions, addFile} from "@app/editor"
  import {MESSAGE} from "@app/state"

  export let url
  export let topic = ""

  const uploading = writable(false)

  let editor: Readable<Editor>

  const sendMessage = () => {
    const json = $editor.getJSON()
    const topicTags = topic ? [["t", topic]] : []
    const mentionTags = findNodes(NProfileExtension.name, json).map(m =>
      makeMention(m.attrs!.pubkey, m.attrs!.relays),
    )
    const imetaTags = findNodes(ImageExtension.name, json).map(({attrs: {src, sha256: x}}: any) =>
      makeIMeta(src, {x, ox: x}),
    )

    const event = createEvent(MESSAGE, {
      content: $editor.getText(),
      tags: [["-"], ...topicTags, ...mentionTags, ...imetaTags],
    })

    publishThunk(makeThunk({event, relays: [url]}))

    $editor.chain().clearContent().run()
  }

  onMount(() => {
    editor = createEditor(getChatEditorOptions({uploading, sendMessage}))
  })
</script>

<div
  class="shadow-top-xl relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100 p-2">
  <Button
    data-tip="Add an image"
    class="center h-10 w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200 tooltip"
    on:click={() => addFile($editor)}>
    {#if $uploading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="flex-grow overflow-hidden">
    <EditorContent editor={$editor} />
  </div>
</div>
