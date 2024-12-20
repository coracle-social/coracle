<script lang="ts">
  import {fromNostrURI} from "@welshman/util"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper as="span">
  <button class="tiptap-object {selected ? 'tiptap-active' : ''}">
    {fromNostrURI(node.attrs.nevent).slice(0, 16)}...
  </button>
</NodeViewWrapper>
