<script lang="ts">
  import cx from 'classnames'
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'
  import Icon from '@lib/components/Icon.svelte'

  export let node: NodeViewProps['node']
</script>

<NodeViewWrapper class="inline link-content">
  <Icon icon="paperclip" size={3} class="inline-block translate-y-px" />
  {node.attrs.file.name}
</NodeViewWrapper>
