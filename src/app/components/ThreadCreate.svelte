<script lang="ts">
  import {writable} from "svelte/store"
  import {createEvent, THREAD} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {isMobile, preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {pushToast} from "@app/toast"
  import {GENERAL, tagRoom, PROTECTED} from "@app/state"
  import {makeEditor} from "@app/editor"

  const {url} = $props()

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

    const content = editor.getText({blockSeparator: "\n"}).trim()

    if (!content.trim()) {
      return pushToast({
        theme: "error",
        message: "Please provide a message for your thread.",
      })
    }

    const tags = [
      ...editor.storage.nostr.getEditorTags(),
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

  const editor = makeEditor({submit, uploading, placeholder: "What's on your mind?"})

  let title: string = $state("")
</script>

<form class="column gap-4" onsubmit={preventDefault(submit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Create a Thread</div>
    {/snippet}
    {#snippet info()}
      <div>Share a link, or start a discussion.</div>
    {/snippet}
  </ModalHeader>
  <div class="col-8 relative">
    <Field>
      {#snippet label()}
        <p>Title*</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <!-- svelte-ignore a11y_autofocus -->
          <input
            autofocus={!isMobile}
            bind:value={title}
            class="grow"
            type="text"
            placeholder="What is this thread about?" />
        </label>
      {/snippet}
    </Field>
    <Field>
      {#snippet label()}
        <p>Message*</p>
      {/snippet}
      {#snippet input()}
        <div class="note-editor flex-grow overflow-hidden">
          <EditorContent {editor} />
        </div>
      {/snippet}
    </Field>
    <Button
      data-tip="Add an image"
      class="tooltip tooltip-left absolute bottom-1 right-2"
      onclick={editor.commands.selectFiles}>
      {#if $uploading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <Icon icon="paperclip" size={3} />
      {/if}
    </Button>
  </div>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">Create Thread</Button>
  </ModalFooter>
</form>
