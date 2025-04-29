<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {isMobile, preventDefault} from "@lib/html"
  import {fly} from "@lib/transition"
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

  const selectFiles = () => editor.then(ed => ed.commands.selectFiles())

  const submit = async () => {
    if ($uploading) return

    const ed = await editor
    const content = ed.getText({blockSeparator: "\n"}).trim()
    const tags = [...ed.storage.nostr.getEditorTags(), tagRoom(GENERAL, url), PROTECTED]

    if (!content) {
      return pushToast({
        theme: "error",
        message: "Please provide a message for your reply.",
      })
    }

    onSubmit(publishComment({event, content, tags, relays: [url]}))
  }

  const editor = makeEditor({url, submit, uploading, autofocus: !isMobile})

  let form: HTMLElement
  let spacer: HTMLElement

  onMount(() => {
    setTimeout(() => {
      spacer.scrollIntoView({block: "end", behavior: "smooth"})
    })

    const observer = new ResizeObserver(() => {
      spacer!.style.minHeight = `${form!.offsetHeight}px`
    })

    observer.observe(form!)

    return () => {
      observer.unobserve(form!)
    }
  })
</script>

<div bind:this={spacer}></div>
<form
  in:fly
  bind:this={form}
  onsubmit={preventDefault(submit)}
  class="cb cw fixed z-feature -mx-2 pt-3">
  <div class="card2 mx-2 my-2 bg-neutral">
    <div class="relative">
      <div class="note-editor flex-grow overflow-hidden">
        <EditorContent {editor} />
      </div>
      <Button
        data-tip="Add an image"
        class="tooltip tooltip-left absolute bottom-1 right-2"
        onclick={selectFiles}>
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
  </div>
</form>
