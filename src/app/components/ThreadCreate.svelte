<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {createEvent, NOTE} from "@welshman/util"
  import {publishThunk, makeThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {getPubkeyHints} from "@app/commands"
  import {getEditorOptions, addFile, uploadFiles, getEditorTags} from "@lib/editor"
  import {clearModal} from "@app/modal"

  export let url

  const startSubmit = () => uploadFiles($editor)

  const back = () => history.back()

  const loading = writable(false)

  const submit = () => {
    const event = createEvent(NOTE, {content: $editor.getText(), tags: getEditorTags($editor)})

    publishThunk(makeThunk({event, relays: [url]}))
    clearModal()
  }

  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints, autofocus: true}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={startSubmit}>
  <div class="py-2">
    <h1 class="heading">Create a Thread</h1>
    <p class="text-center">Share your thoughts, or start a discussion.</p>
  </div>
  <div class="relative">
    <div class="note-editor flex-grow overflow-hidden">
      <EditorContent editor={$editor} />
    </div>
    <Button
      data-tip="Add an image"
      class="tooltip tooltip-left absolute bottom-1 right-2"
      on:click={() => addFile($editor)}>
      {#if $loading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <Icon icon="paperclip" size={3} />
      {/if}
    </Button>
  </div>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Thread</Button>
  </div>
</form>
