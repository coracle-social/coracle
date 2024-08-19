<script lang="ts">
  import cx from 'classnames'
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'
  import {stripProtocol} from '@welshman/lib'
  import Icon from '@lib/components/Icon.svelte'
  import Link from '@lib/components/Link.svelte'

  export let node: NodeViewProps['node']
</script>

<NodeViewWrapper class="inline">
  <Link external href={node.attrs.url} class="link-content">
    <Icon icon="link-round" size={3} class="inline-block translate-y-px" />
    {stripProtocol(node.attrs.url)}
  </Link>
</NodeViewWrapper>

