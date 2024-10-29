<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import PersonLink from "src/app/shared/PersonLink.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class={cx("link-content inline", {"link-content-selected": selected})}>
  <PersonLink pubkey={node.attrs.pubkey} />
</NodeViewWrapper>
