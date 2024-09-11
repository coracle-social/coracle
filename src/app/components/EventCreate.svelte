<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {NProfileExtension, ImageExtension} from "nostr-editor"
  import {createEvent, EVENT_DATE, EVENT_TIME} from "@welshman/util"
  import {publishThunk, makeThunk} from "@welshman/app"
  import {findNodes} from "@lib/tiptap"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import {makeMention, makeIMeta} from "@app/commands"
  import {getNoteEditorOptions, addFile} from "@app/editor"
  import {pushModal} from "@app/modal"

  export let url

  const next = () => null

  const back = () => history.back()

  const uploading = writable(false)

  const sendMessage = () => {
    const json = $editor.getJSON()
    const kind = isAllDay ? EVENT_DATE : EVENT_TIME
    const mentionTags = findNodes(NProfileExtension.name, json).map(m =>
      makeMention(m.attrs!.pubkey, m.attrs!.relays),
    )
    const imetaTags = findNodes(ImageExtension.name, json).map(({attrs: {src, sha256: x}}: any) =>
      makeIMeta(src, {x, ox: x}),
    )

    const event = createEvent(kind, {
      content: $editor.getText(),
      tags: [["-"], ...mentionTags, ...imetaTags],
    })

    publishThunk(makeThunk({event, relays: [url]}))

    $editor.chain().clearContent().run()
  }

  let editor: Readable<Editor>
  let isAllDay = false
  let file: File
  let title = ""
  let location = ""
  let start = ""
  let end = ""

  onMount(() => {
    editor = createEditor(getNoteEditorOptions({uploading, sendMessage}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={next}>
  <div class="py-2">
    <h1 class="heading">Create an Event</h1>
    <p class="text-center">Invite other group members to events online or in real life.</p>
  </div>
  <Field>
    <p slot="label">Title*</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <input bind:value={title} class="grow" type="text" />
    </label>
  </Field>
  <Field>
    <p slot="label">Summary</p>
    <div
      slot="input"
      class="relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100">
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
  </Field>
  <Field>
    <p slot="label">Location (optional)</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="map-point" />
      <input bind:value={title} class="grow" type="text" />
    </label>
  </Field>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">
      Next
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </Button>
  </div>
</form>

