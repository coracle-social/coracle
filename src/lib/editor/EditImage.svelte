<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import Icon from "@lib/components/Icon.svelte"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]
</script>

<NodeViewWrapper class={cx("link-content inline", {"link-content-selected": selected})}>
  {#if node.attrs.uploading}
    <span class="loading loading-spinner loading-xs translate-y-[2px] scale-75" />
  {:else}
    <Icon icon="paperclip" size={3} class="inline-block translate-y-px" />
  {/if}
  {node.attrs.file.name}
</NodeViewWrapper>
