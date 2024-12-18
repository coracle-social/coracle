<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper>
  <button class="tiptap-object {selected ? 'tiptap-selected' : ''}">
    @{node.attrs.nprofile.slice(0, 16)}...
  </button>
</NodeViewWrapper>
