<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {EditorContent} from "svelte-tiptap"
  import {isMobile, preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {makeEditor} from "@app/editor"

  interface Props {
    onSubmit: any
    content?: string
  }

  const {onSubmit, content = ""}: Props = $props()

  export const focus = () => $editor.chain().focus().run()

  const uploading = writable(false)

  const uploadFiles = () => $editor!.chain().selectFiles().run()

  const submit = () => {
    if ($uploading) return

    const content = $editor!.getText({blockSeparator: "\n"}).trim()
    const tags = $editor!.storage.nostr.getEditorTags()

    if (!content) return

    onSubmit({content, tags})

    $editor!.chain().clearContent().run()
  }

  const editor = makeEditor({autofocus: !isMobile, submit, uploading, aggressive: true})

  onMount(() => {
    $editor!.chain().setContent(content).run()
  })
</script>

<form class="relative z-feature flex gap-2 p-2" onsubmit={preventDefault(submit)}>
  <Button
    data-tip="Add an image"
    class="center tooltip tooltip-right h-10 w-10 min-w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200"
    disabled={$uploading}
    onclick={uploadFiles}>
    {#if $uploading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="chat-editor flex-grow overflow-hidden">
    <EditorContent editor={$editor} />
  </div>
  <Button
    data-tip="{window.navigator.platform.includes('Mac') ? 'cmd' : 'ctrl'}+enter to send"
    class="center tooltip tooltip-left absolute right-4 h-10 w-10 min-w-10 rounded-full"
    disabled={$uploading}
    onclick={submit}>
    <Icon icon="plain" />
  </Button>
</form>
