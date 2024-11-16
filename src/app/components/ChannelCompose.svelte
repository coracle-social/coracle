<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {getEditorOptions, getEditorTags} from "@lib/editor"
  import {getPubkeyHints} from "@app/commands"

  export let onSubmit
  export let content = ""

  let editor: Readable<Editor>

  const submit = () => {
    if ($loading) return

    onSubmit({
      content: $editor.getText({blockSeparator: "\n"}),
      tags: getEditorTags($editor),
    })

    $editor.chain().clearContent().run()
  }

  $: loading = $editor?.storage.fileUpload.loading

  onMount(() => {
    editor = createEditor(
      getEditorOptions({
        submit,
        getPubkeyHints,
        submitOnEnter: true,
        autofocus: !isMobile,
      }),
    )

    $editor.commands.setContent(content)
  })
</script>

<form
  class="relative z-feature flex gap-2 p-2"
  on:submit|preventDefault={$loading ? undefined : submit}>
  <Button
    data-tip="Add an image"
    class="center tooltip tooltip-right h-10 w-10 min-w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200"
    disabled={$loading}
    on:click={$editor.commands.selectFiles}>
    {#if $loading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="chat-editor flex-grow overflow-hidden">
    <EditorContent editor={$editor} />
  </div>
</form>
