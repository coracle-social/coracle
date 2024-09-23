<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {NProfileExtension, ImageExtension} from "nostr-editor"
  import {randomId} from "@welshman/lib"
  import {createEvent, EVENT_DATE, EVENT_TIME} from "@welshman/util"
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
    if (!title) {
      return pushToast({
        theme: "error",
        message: "Please provide a title.",
      })
    }

    if (!start || !end) {
      return pushToast({
        theme: "error",
        message: "Please provide start and end times.",
      })
    }

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
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", dateToSeconds(start).toString()],
        ["end", dateToSeconds(end).toString()],
        ...mentionTags,
        ...imetaTags,
      ],
    })

    publishThunk(makeThunk({event, relays: [url]}))
    clearModal()
  }

  let editor: Readable<Editor>
  let isAllDay = false
  let file: File
  let title = ""
  let location = ""
  let start: Date
  let end: Date

  onMount(() => {
    editor = createEditor(getNoteEditorOptions({uploading, sendMessage}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
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
      <div class="flex-grow overflow-hidden input-editor">
        <EditorContent editor={$editor} />
      </div>
      <Button
        data-tip="Add an image"
        class="btn center tooltip"
        on:click={() => addFile($editor)}>
        {#if $uploading}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <Icon icon="gallery-send" />
        {/if}
      </Button>
    </div>
  </Field>
  <Field>
    <div slot="input" class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-1">
        <strong>Start</strong>
        <DateTimeInput bind:value={start} />
      </div>
      <div class="flex flex-col gap-1">
        <strong>End</strong>
        <DateTimeInput bind:value={end} />
      </div>
    </div>
  </Field>
  <Field>
    <p slot="label">Location (optional)</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="map-point" />
      <input bind:value={location} class="grow" type="text" />
    </label>
  </Field>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">
      Create Event
    </Button>
  </div>
</form>

