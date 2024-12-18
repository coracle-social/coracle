<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper
  class="tiptap-object {selected ? 'tiptap-selected' : ''} {node.attrs.uploading
    ? 'tiptap-uploading'
    : ''}">
  {node.attrs.file?.name || node.attrs.src}
</NodeViewWrapper>
