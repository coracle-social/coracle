<script lang="ts">
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'

  export let node: NodeViewProps['node']
</script>

<NodeViewWrapper class="inline link-content">
  {node.attrs.lnbc.slice(0, 16)}...
</NodeViewWrapper>
