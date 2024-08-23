<script lang="ts">
  import cx from 'classnames'
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'
  import {clip} from '@app/toast'

  export let node: NodeViewProps['node']
  export let selected: NodeViewProps['selected']

  const copy = () => clip(node.attrs.lnbc)
</script>

<NodeViewWrapper class="inline">
  <Button on:click={copy} class={cx("link-content", {'link-content-selected': selected})}>
    <Icon icon="bolt" size={3} class="inline-block translate-y-px" />
    {node.attrs.lnbc.slice(0, 16)}...
  </Button>
</NodeViewWrapper>
