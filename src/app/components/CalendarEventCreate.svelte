<script lang="ts">
  import {writable} from "svelte/store"
  import {randomId, HOUR} from "@welshman/lib"
  import {createEvent, EVENT_TIME} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import {daysBetween} from "@lib/util"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import DateTimeInput from "@lib/components/DateTimeInput.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {PROTECTED, GENERAL, tagRoom} from "@app/state"
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

    if (start >= end) {
      return pushToast({
        theme: "error",
        message: "End time must be later than start time.",
      })
    }

    const event = createEvent(EVENT_TIME, {
      content: editor.getText({blockSeparator: "\n"}).trim(),
      tags: [
        ["d", randomId()],
        ["title", title],
        ["location", location],
        ["start", start.toString()],
        ["end", end.toString()],
        ...daysBetween(start, end).map(D => ["D", D.toString()]),
        ...editor.storage.nostr.getEditorTags(),
        tagRoom(GENERAL, url),
        PROTECTED,
      ],
    })

    pushToast({message: "Your event has been published!"})
    publishThunk({event, relays: [url]})
    history.back()
  }

  const editor = makeEditor({submit, uploading})

  let title = $state("")
  let location = $state("")
  let start: number | undefined = $state()
  let end: number | undefined = $state()
  let endDirty = false

  $effect(() => {
    if (!endDirty && start) {
      end = start + HOUR
    } else if (end) {
      endDirty = true
    }
  })
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
    {#snippet label()}
      Start*
    {/snippet}
    {#snippet input()}
      <DateTimeInput bind:value={start} />
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      End*
    {/snippet}
    {#snippet input()}
      <DateTimeInput bind:value={end} />
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
    <Button type="submit" class="btn btn-primary" disabled={$uploading}>
      <Spinner loading={$uploading}>Create Event</Spinner>
    </Button>
  </ModalFooter>
</form>
