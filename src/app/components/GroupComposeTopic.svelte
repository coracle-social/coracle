<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import Link from "@lib/components/Link.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class="inline">
  <Link
    external
    href="https://coracle.social/topics/{node.attrs.topic.toLowerCase()}"
    class={cx("link-content", {"link-content-selected": selected})}>
    #{node.attrs.topic}
  </Link>
</NodeViewWrapper>
