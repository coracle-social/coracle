<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {createEvent} from "@welshman/util"
  import {publishThunk, makeThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {getEditorOptions, getEditorTags, addFile} from "@lib/editor"
  import {ROOM, MESSAGE, GENERAL} from "@app/state"
  import {getPubkeyHints} from "@app/commands"

  export let url
  export let room = GENERAL

  const loading = writable(false)

  let editor: Readable<Editor>

  const submit = () => {
    const event = createEvent(MESSAGE, {
      content: $editor.getText(),
      tags: [[ROOM, room], ...getEditorTags($editor)],
    })

    publishThunk(makeThunk({event, relays: [url]}))

    $editor.chain().clearContent().run()
  }

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints, submitOnEnter: true, autofocus: true}))
  })
</script>

<div
  class="shadow-top-xl relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100 p-2">
  <Button
    data-tip="Add an image"
    class="center tooltip h-10 w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200"
    on:click={() => addFile($editor)}>
    {#if $loading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="chat-editor flex-grow overflow-hidden">
    <EditorContent editor={$editor} />
  </div>
</div>
