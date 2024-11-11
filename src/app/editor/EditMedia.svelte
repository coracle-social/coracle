<style>
  .loading {
    animation: blurPulse 1.5s infinite;
  }

  @keyframes blurPulse {
    0% {
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.2;
    }
  }
</style>

<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import cx from "classnames"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<!-- this component display image or videos only, the filter is made by tiptap -->
<NodeViewWrapper
  class={cx("link-content inline", {
    "link-content-selected": selected,
  })}>
  <span class:loading={node.attrs.uploading}>
    <i class="fas fa-xs fa-paperclip"></i>
    {node.attrs.file?.name || node.attrs.src}
  </span>
</NodeViewWrapper>
