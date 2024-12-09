<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {randomId} from "@welshman/lib"
  import {createEvent, EVENT_DATE, EVENT_TIME} from "@welshman/util"
  import {publishThunk, dateToSeconds} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import {PROTECTED} from "@app/state"
  import {getPubkeyHints} from "@app/commands"
  import {getEditorOptions, getEditorTags} from "@lib/editor"
  import {pushToast} from "@app/toast"

  export let url

  const back = () => history.back()

  const submit = () => {
    if ($loading) return

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
      content: $editor.getText({blockSeparator: "\n"}),
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", dateToSeconds(start).toString()],
        ["end", dateToSeconds(end).toString()],
        ...getEditorTags($editor),
        PROTECTED,
      ],
    })

    publishThunk({event, relays: [url]})
    history.back()
  }

  let editor: Readable<Editor>
  const isAllDay = false
  let title = ""
  let location = ""
  let start: Date
  let end: Date

  $: loading = $editor?.storage.fileUpload.loading

  onMount(() => {
    editor = createEditor(getEditorOptions({submit, getPubkeyHints}))
  })
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
  <ModalHeader>
    <div slot="title">Create an Event</div>
    <div slot="info">Invite other group members to events online or in real life.</div>
  </ModalHeader>
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
      <Button
        data-tip="Add an image"
        class="center btn tooltip"
        on:click={$editor.commands.selectFiles}>
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
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Event</Button>
  </ModalFooter>
</form>
