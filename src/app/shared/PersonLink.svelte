<script lang="ts">
  import cx from "classnames"
  import {deriveProfileDisplay} from "@welshman/app"
  import {NodeViewWrapper} from "svelte-tiptap"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import type {NodeViewProps} from "@tiptap/core"
  import type {NProfileAttributes} from "nostr-editor"

  export let node: NodeViewProps["node"] = undefined
  export let pubkey: string
  export let underline = true

  $: attrs = node?.attrs as NProfileAttributes

  $: pubkey = pubkey || attrs?.pubkey || ""
  $: path = router.at("people").of(pubkey).toString()
  $: display = deriveProfileDisplay(pubkey)
</script>

<!-- if node is present, we are in a texteditor context -->
{#if node}
  <NodeViewWrapper data-type="mention" as="span">
    <Anchor modal stopPropagation class={$$props.class} href={path}>
      @<span class={cx({underline})}>{$display}</span>
    </Anchor>
  </NodeViewWrapper>
{:else}
  <Anchor modal stopPropagation class={$$props.class} href={path}>
    @<span class={cx({underline})}>{$display}</span>
  </Anchor>
{/if}
