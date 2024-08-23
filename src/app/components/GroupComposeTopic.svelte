<script lang="ts">
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'

  export let node: NodeViewProps['node']
</script>

<NodeViewWrapper class="inline text-primary">
  #<span class="underline">{node.attrs.name}</span>
</NodeViewWrapper>
