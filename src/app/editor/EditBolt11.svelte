<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import Anchor from "src/partials/Anchor.svelte"
  import {copyToClipboard} from "src/util/html"
  import {showInfo} from "src/partials/Toast.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  const copy = () => copyToClipboard(node.attrs.lnbc) && showInfo("Copied to clipboard")
</script>

<NodeViewWrapper class="inline">
  <Anchor on:click={copy} class={cx("link-content", {"link-content-selected": selected})}>
    <i class="fas fa-bolt inline-block translate-y-px"></i>
    {node.attrs.lnbc.slice(0, 16)}...
  </Anchor>
</NodeViewWrapper>
