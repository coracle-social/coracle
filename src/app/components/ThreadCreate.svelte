<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {NProfileExtension, ImageExtension} from "nostr-editor"
  import {randomId} from "@welshman/lib"
  import {createEvent, NOTE} from "@welshman/util"
  import {publishThunk, makeThunk, dateToSeconds} from "@welshman/app"
  import {findNodes} from "@lib/tiptap"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import {makeMention, makeIMeta} from "@app/commands"
  import {getNoteEditorOptions, addFile, uploadFiles} from "@app/editor"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"

  export let url

  const submit = () => uploadFiles($editor)

  const back = () => history.back()

  const uploading = writable(false)

  const sendMessage = () => {
    const json = $editor.getJSON()
    const mentionTags = findNodes(NProfileExtension.name, json).map(m =>
      makeMention(m.attrs!.pubkey, m.attrs!.relays),
    )
    const imetaTags = findNodes(ImageExtension.name, json).map(({attrs: {src, sha256: x}}: any) =>
      makeIMeta(src, {x, ox: x}),
    )

    const event = createEvent(NOTE, {
      content: $editor.getText(),
      tags: [
        ...mentionTags,
        ...imetaTags,
      ],
    })

    publishThunk(makeThunk({event, relays: [url]}))
    clearModal()
  }

  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getNoteEditorOptions({uploading, sendMessage}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
  <div class="py-2">
    <h1 class="heading">Create a Thread</h1>
    <p class="text-center">Share your thoughts, or start a discussion.</p>
  </div>
  <div class="relative">
    <div class="flex-grow overflow-hidden note-editor">
      <EditorContent editor={$editor} />
    </div>
    <Button
      data-tip="Add an image"
      class="tooltip tooltip-left absolute right-2 bottom-1"
      on:click={() => addFile($editor)}>
      {#if $uploading}
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
    <Button type="submit" class="btn btn-primary">
      Create Thread
    </Button>
  </div>
</form>

