<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {createEvent, THREAD} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {GENERAL, tagRoom, PROTECTED} from "@app/state"
  import {getEditor} from "@app/editor"

  export let url

  const uploading = writable(false)

  const back = () => history.back()

  const submit = () => {
    if ($uploading) return

    if (!title) {
      return pushToast({
        theme: "error",
        message: "Please provide a title for your thread.",
      })
    }

    const content = $editor.getText({blockSeparator: "\n"}).trim()

    if (!content.trim()) {
      return pushToast({
        theme: "error",
        message: "Please provide a message for your thread.",
      })
    }

    const tags = [
      ...$editor.storage.nostr.getEditorTags(),
      tagRoom(GENERAL, url),
      ["title", title],
      PROTECTED,
    ]

    publishThunk({
      relays: [url],
      event: createEvent(THREAD, {content, tags}),
    })

    history.back()
  }

  let title: string
  let element: HTMLElement
  let editor: ReturnType<typeof getEditor>

  onMount(() => {
    editor = getEditor({submit, element, uploading, placeholder: "What's on your mind?"})
  })
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
  <ModalHeader>
    <div slot="title">Create a Thread</div>
    <div slot="info">Share a link, or start a discussion.</div>
  </ModalHeader>
  <div class="col-8 relative">
    <Field>
      <p slot="label">Title*</p>
      <label class="input input-bordered flex w-full items-center gap-2" slot="input">
        <!-- svelte-ignore a11y-autofocus -->
        <input
          autofocus={!isMobile}
          bind:value={title}
          class="grow"
          type="text"
          placeholder="What is this thread about?" />
      </label>
    </Field>
    <Field>
      <p slot="label">Message*</p>
      <div slot="input" class="note-editor flex-grow overflow-hidden">
        <div bind:this={element} />
      </div>
    </Field>
    <Button
      data-tip="Add an image"
      class="tooltip tooltip-left absolute bottom-1 right-2"
      on:click={$editor.commands.selectFiles}>
      {#if $uploading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <Icon icon="paperclip" size={3} />
      {/if}
    </Button>
  </div>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Thread</Button>
  </ModalFooter>
</form>
