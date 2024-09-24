<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {createEditor, type Editor, EditorContent} from "svelte-tiptap"
  import {displayPubkey} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestamp} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"
  import {getEditorOptions} from "@lib/editor"

  export let root
  export let replies

  const profile = deriveProfile(root.pubkey)
  const profileDisplay = deriveProfileDisplay(root.pubkey)

  let editor: Readable<Editor>

  onMount(() => {
    editor = createEditor(getEditorOptions({}))

    setTimeout(() => $editor.commands.insertContent(root.content, {applyPasteRules: true}), 100)
  })
</script>

<div>
  <div class="card2 flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-2">
        <div class="py-1">
          <Avatar src={$profile?.picture} size={10} />
        </div>
        <div class="flex flex-col">
          <div class="text-bold">{$profileDisplay}</div>
          <div class="text-sm opacity-75">{displayPubkey(root.pubkey)}</div>
        </div>
      </div>
      <span class="text-sm opacity-75">{formatTimestamp(root.created_at)}</span>
    </div>
    <div class="ml-12">
      <EditorContent editor={$editor} />
    </div>
  </div>
  {#if replies.length > 0}
    Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
  {/if}
</div>
