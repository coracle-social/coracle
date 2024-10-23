<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {fly, slideAndFade} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {getPubkeyHints, publishReply} from "@app/commands"
  import {getEditorOptions, addFile, uploadFiles, getEditorTags} from "@lib/editor"

  export let url
  export let event
  export let onClose
  export let onSubmit

  const startSubmit = () => uploadFiles($editor)

  const loading = writable(false)

  const submit = () => {
    onSubmit(
      publishReply({
        event,
        content: $editor.getText(),
        tags: getEditorTags($editor),
        relays: [url],
      }),
    )
  }

  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints, autofocus: true}))
  })
</script>

<form
  on:submit|preventDefault={startSubmit}
  in:fly
  out:slideAndFade
  class="card2 sticky bottom-2 z-feature mx-2 mt-2 bg-neutral">
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
    <Button class="btn btn-link" on:click={onClose}>Cancel</Button>
    <Button type="submit" class="btn btn-primary">Post Reply</Button>
  </ModalFooter>
</form>
