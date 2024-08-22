<script lang="ts">
  import cx from 'classnames'
  import type {NodeViewProps} from '@tiptap/core'
  import {NodeViewWrapper} from 'svelte-tiptap'
  import {displayProfile} from '@welshman/util'
  import Link from '@lib/components/Link.svelte'
  import {deriveProfile} from '@app/state'

  export let node: NodeViewProps['node']

  $: profile = deriveProfile(node.attrs.pubkey, node.attrs.relays)
</script>

<NodeViewWrapper class="inline">
  <span class="text-primary">@</span><Link external href="https://njump.me/{node.attrs.nprofile}">{displayProfile($profile)}</Link>
</NodeViewWrapper>
