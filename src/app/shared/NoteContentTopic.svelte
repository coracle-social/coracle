<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import {NodeViewWrapper, NodeViewContent} from "svelte-tiptap"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {makeFeed} from "src/domain"
  import type {NodeViewProps} from "@tiptap/core"

  export let node: NodeViewProps["node"] = undefined
  export let value: string

  $: attrs = node?.attrs as NProfileAttributes
  $: console.log(node, node?.attrs)

  $: feed = makeFeed({definition: makeTagFeed("#t", value)})

  const onClick = () => router.at("notes").cx({feed}).push()
</script>

{#if node}
  <NodeViewWrapper data-type="tag" as="span">
    <Anchor modal underline on:click={onClick}>
      #{value}
    </Anchor>
  </NodeViewWrapper>
{:else}
  <Anchor modal underline on:click={onClick}>
    #{value}
  </Anchor>
{/if}
