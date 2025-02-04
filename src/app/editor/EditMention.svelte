<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {deriveProfileDisplay} from "@welshman/app"

  interface Props {
    node: NodeViewProps["node"]
    selected: NodeViewProps["selected"]
  }

  let {node, selected}: Props = $props()

  const display = deriveProfileDisplay(node.attrs.pubkey)
</script>

<NodeViewWrapper as="span">
  <button class="tiptap-object {selected ? 'tiptap-active' : ''}">
    @{$display}
  </button>
</NodeViewWrapper>
