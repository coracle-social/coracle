<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  $: profile = deriveProfile(node.attrs.pubkey, node.attrs.relays)
</script>

<NodeViewWrapper class="inline">
  <Link
    external
    href="https://njump.me/{node.attrs.nprofile}"
    class={cx("link-content", {"link-content-selected": selected})}>
    @{displayProfile($profile)}
  </Link>
</NodeViewWrapper>
