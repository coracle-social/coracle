<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {displayUrl} from "@welshman/lib"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class="inline-block">
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={node.attrs.url}
    class={cx("link-content", {"link-content-selected": selected})}>
    <i class="fas fa-link inline-block"></i>
    {displayUrl(node.attrs.url)}
  </a>
</NodeViewWrapper>
