<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {createEvent} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {fly} from '@lib/transition'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {REPLY} from "@app/state"
  import {getPubkeyHints, publishReply} from "@app/commands"
  import {getEditorOptions, addFile, uploadFiles, getEditorTags} from "@lib/editor"

  export let url
  export let event

  const startSubmit = () => uploadFiles($editor)

  const loading = writable(false)

  const submit = () => {
    const thunk = publishReply({
      event,
      content: $editor.getText(),
      tags: getEditorTags($editor),
      relays: [url],
    })

    hide()
  }

  const show = () => {
    visible = true
  }

  const hide = () => {
    visible = false
  }

  let visible = false
  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints, autofocus: true}))
  })
</script>

{#if visible}
  <form on:submit|preventDefault={startSubmit} in:fly class="sticky bottom-2 card2 bg-alt mt-2 mx-2">
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
      <Button class="btn btn-link" on:click={hide}>
        Cancel
      </Button>
      <Button type="submit" class="btn btn-primary">Post Reply</Button>
    </ModalFooter>
  </form>
{:else}
  <div class="flex justify-end p-2">
    <Button class="btn btn-primary" on:click={show}>
      <Icon icon="reply" />
      Reply
    </Button>
  </div>
{/if}
