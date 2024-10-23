<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {createEvent, NOTE} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {getPubkeyHints} from "@app/commands"
  import {getEditorOptions, addFile, uploadFiles, getEditorTags} from "@lib/editor"

  export let url

  const startSubmit = () => uploadFiles($editor)

  const back = () => history.back()

  const loading = writable(false)

  const submit = () => {
    const event = createEvent(NOTE, {content: $editor.getText(), tags: getEditorTags($editor)})

    publishThunk({event, relays: [url]})
    history.back()
  }

  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints, autofocus: true}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={startSubmit}>
  <ModalHeader>
    <div slot="title">Create a Thread</div>
    <div slot="info">Share a link, or start a discussion.</div>
  </ModalHeader>
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
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Thread</Button>
  </ModalFooter>
</form>
