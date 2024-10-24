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
    rel="noopener noreferer"
    target="_blank"
    class={cx("link-content", {"link-content-selected": selected})}>
    <i class="fa fa-link" aria-hidden="true"></i>
    {displayUrl(node.attrs.url)}
  </a>
</NodeViewWrapper>
