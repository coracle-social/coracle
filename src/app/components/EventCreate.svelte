<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {randomId} from "@welshman/lib"
  import {createEvent, EVENT_TIME} from "@welshman/util"
  import {publishThunk, dateToSeconds} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import {PROTECTED} from "@app/state"
  import {getEditor} from "@app/editor"
  import {pushToast} from "@app/toast"

  export let url

  const uploading = writable(false)

  const back = () => history.back()

  const submit = () => {
    if ($uploading) return

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

    const event = createEvent(EVENT_TIME, {
      content: $editor.getText({blockSeparator: "\n"}).trim(),
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", dateToSeconds(start).toString()],
        ["end", dateToSeconds(end).toString()],
        ...$editor.storage.welshman.getEditorTags(),
        PROTECTED,
      ],
    })

    publishThunk({event, relays: [url]})
    history.back()
  }

  let element: HTMLElement
  let editor: ReturnType<typeof getEditor>
  let title = ""
  let location = ""
  let start: Date
  let end: Date

  onMount(() => {
    editor = getEditor({submit, element, uploading})
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
        <div bind:this={element} />
      </div>
      <Button
        data-tip="Add an image"
        class="center btn tooltip"
        on:click={() => $editor.chain().selectFiles().run()}>
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
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Event</Button>
  </ModalFooter>
</form>
