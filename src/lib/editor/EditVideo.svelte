<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import Icon from "@lib/components/Icon.svelte"

  export let node: NodeViewProps["node"]
</script>

<NodeViewWrapper class="link-content inline">
  {#if node.attrs.uploading}
    <span class="loading loading-spinner loading-xs translate-y-[2px] scale-75" />
  {:else}
    <Icon icon="paperclip" size={3} class="inline-block translate-y-px" />
  {/if}
  {node.attrs.file.name}
</NodeViewWrapper>
