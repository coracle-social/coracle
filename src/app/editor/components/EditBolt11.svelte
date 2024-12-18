<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class="inline">
  <button class="we-object {selected ? 'we-selected' : ''}">
    {node.attrs.lnbc.slice(0, 16)}...
  </button>
</NodeViewWrapper>
