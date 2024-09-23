<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {randomId} from "@welshman/lib"
  import {createEvent, EVENT_DATE, EVENT_TIME} from "@welshman/util"
  import {publishThunk, makeThunk, dateToSeconds} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import {getPubkeyHints} from "@app/commands"
  import {getEditorOptions, addFile, uploadFiles, getEditorTags} from "@lib/editor"
  import {clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"

  export let url

  const startSubmit = () => uploadFiles($editor)

  const back = () => history.back()

  const loading = writable(false)

  const submit = () => {
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

    const kind = isAllDay ? EVENT_DATE : EVENT_TIME
    const event = createEvent(kind, {
      content: $editor.getText(),
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", dateToSeconds(start).toString()],
        ["end", dateToSeconds(end).toString()],
        ...getEditorTags($editor),
      ],
    })

    publishThunk(makeThunk({event, relays: [url]}))
    clearModal()
  }

  let editor: Readable<Editor>
  const isAllDay = false
  let title = ""
  let location = ""
  let start: Date
  let end: Date

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, loading, getPubkeyHints}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={startSubmit}>
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
      <div class="input-editor flex-grow overflow-hidden">
        <EditorContent editor={$editor} />
      </div>
      <Button data-tip="Add an image" class="center btn tooltip" on:click={() => addFile($editor)}>
        {#if $loading}
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
    <Button type="submit" class="btn btn-primary">Create Event</Button>
  </div>
</form>
