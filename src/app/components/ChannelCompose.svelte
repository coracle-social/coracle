<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {writable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import {getEditorOptions, getEditorTags, addFile} from "@lib/editor"
  import {getPubkeyHints} from "@app/commands"

  export let onSubmit
  export let content = ""

  const loading = writable(false)

  let editor: Readable<Editor>

  const submit = () => {
    onSubmit({
      content: $editor.getText(),
      tags: getEditorTags($editor),
    })

    $editor.chain().clearContent().run()
  }

  onMount(() => {
    editor = createEditor(
      getEditorOptions({submit, loading, getPubkeyHints, submitOnEnter: true, autofocus: true}),
    )

    $editor.commands.setContent(content)
  })
</script>

<div class="relative z-feature flex gap-2 p-2">
  <Button
    data-tip="Add an image"
    class="center tooltip tooltip-right h-10 w-10 min-w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200"
    on:click={() => addFile($editor)}>
    {#if $loading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="chat-editor flex-grow overflow-hidden">
    <EditorContent editor={$editor} />
  </div>
</div>
