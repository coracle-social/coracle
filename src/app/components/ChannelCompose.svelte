<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {getEditor} from "@app/editor"

  export let onSubmit: any
  export let content = ""
  export let editor: ReturnType<typeof getEditor> | undefined = undefined

  const uploading = writable(false)

  let element: HTMLElement

  const uploadFiles = () => $editor!.chain().selectFiles().run()

  const submit = () => {
    if ($uploading) return

    onSubmit({
      content: $editor!.getText({blockSeparator: "\n"}).trim(),
      tags: $editor!.storage.nostr.getEditorTags(),
    })

    $editor!.chain().clearContent().run()
  }

  onMount(() => {
    editor = getEditor({autofocus: !isMobile, aggressive: true, element, submit, uploading})

    $editor!.chain().setContent(content).run()
  })
</script>

<form
  class="relative z-feature flex gap-2 p-2"
  on:submit|preventDefault={$uploading ? undefined : submit}>
  <Button
    data-tip="Add an image"
    class="center tooltip tooltip-right h-10 w-10 min-w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200"
    disabled={$uploading}
    on:click={uploadFiles}>
    {#if $uploading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="chat-editor flex-grow overflow-hidden">
    <div bind:this={element} />
  </div>
</form>
