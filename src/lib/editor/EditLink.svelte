<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {displayUrl} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class="inline-block">
  <Link
    external
    href={node.attrs.url}
    class={cx("link-content", {"link-content-selected": selected})}>
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(node.attrs.url)}
  </Link>
</NodeViewWrapper>
