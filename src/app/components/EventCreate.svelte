<script lang="ts">
  import {writable} from "svelte/store"
  import {randomId} from "@welshman/lib"
  import {createEvent, EVENT_TIME} from "@welshman/util"
  import {publishThunk, dateToSeconds} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {PROTECTED} from "@app/state"
  import {makeEditor} from "@app/editor"
  import {pushToast} from "@app/toast"

  const {url} = $props()

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
      content: editor.getText({blockSeparator: "\n"}).trim(),
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", dateToSeconds(start).toString()],
        ["end", dateToSeconds(end).toString()],
        ...editor.storage.nostr.getEditorTags(),
        PROTECTED,
      ],
    })

    publishThunk({event, relays: [url]})
    history.back()
  }

  const editor = makeEditor({submit, uploading})

  let title = $state("")
  let location = $state("")
  let start: Date | undefined = $state()
  let end: Date | undefined = $state()
</script>

<form class="column gap-4" onsubmit={preventDefault(submit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Create an Event</div>
    {/snippet}
    {#snippet info()}
      <div>Invite other group members to events online or in real life.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Title*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <input bind:value={title} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Summary</p>
    {/snippet}
    {#snippet input()}
      <div class="relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100">
        <div class="input-editor flex-grow overflow-hidden">
          <EditorContent {editor} />
        </div>
        <Button
          data-tip="Add an image"
          class="center btn tooltip"
          onclick={() => editor.chain().selectFiles().run()}>
          {#if $uploading}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <Icon icon="gallery-send" />
          {/if}
        </Button>
      </div>
    {/snippet}
  </Field>
  <Field>
    {#snippet input()}
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <strong>Start</strong>
          <DateTimeInput bind:value={start} />
        </div>
        <div class="flex flex-col gap-1">
          <strong>End</strong>
          <DateTimeInput bind:value={end} />
        </div>
      </div>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Location (optional)</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="map-point" />
        <input bind:value={location} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Event</Button>
  </ModalFooter>
</form>
