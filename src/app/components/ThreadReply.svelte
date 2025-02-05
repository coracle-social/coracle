<script lang="ts">
  import {writable} from "svelte/store"
  import {isMobile, preventDefault} from "@lib/html"
  import {fly, slideAndFade} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import EditorContent from "@app/editor/EditorContent.svelte"
  import {publishComment} from "@app/commands"
  import {tagRoom, GENERAL, PROTECTED} from "@app/state"
  import {makeEditor} from "@app/editor"
  import {pushToast} from "@app/toast"

  const {url, event, onClose, onSubmit} = $props()

  const uploading = writable(false)

  const submit = () => {
    if ($uploading) return

    const content = editor.getText({blockSeparator: "\n"}).trim()
    const tags = [...editor.storage.nostr.getEditorTags(), tagRoom(GENERAL, url), PROTECTED]

    if (!content) {
      return pushToast({
        theme: "error",
        message: "Please provide a message for your reply.",
      })
    }

    onSubmit(publishComment({event, content, tags, relays: [url]}))
  }

  const editor = makeEditor({submit, uploading, autofocus: !isMobile})
</script>

<form
  in:fly
  out:slideAndFade
  onsubmit={preventDefault(submit)}
  class="card2 sticky bottom-2 z-feature mx-2 mt-4 bg-neutral">
  <div class="relative">
    <div class="note-editor flex-grow overflow-hidden">
      <EditorContent {editor} />
    </div>
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
    <Button class="btn btn-link" onclick={onClose}>Cancel</Button>
    <Button type="submit" class="btn btn-primary">Post Reply</Button>
  </ModalFooter>
</form>
