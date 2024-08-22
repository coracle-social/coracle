<script lang="ts">
  import cx from 'classnames'
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'
  import Icon from '@lib/components/Icon.svelte'

  export let node: NodeViewProps['node']
  export let selected: NodeViewProps['selected']
</script>

<NodeViewWrapper class={cx("inline link-content", {'link-content-selected': selected})}>
  <Icon icon="paperclip" size={3} class="inline-block translate-y-px" />
  {node.attrs.file.name}
</NodeViewWrapper>
