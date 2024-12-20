<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {deriveProfileDisplay} from "@welshman/app"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  const display = deriveProfileDisplay(node.attrs.pubkey)
</script>

<NodeViewWrapper as="span">
  <button class="tiptap-object {selected ? 'tiptap-active' : ''}">
    @{$display}
  </button>
</NodeViewWrapper>
