<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushDrawer} from "@app/modal"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  const onClick = () => pushDrawer(ProfileDetail, {pubkey: node.attrs.pubkey})

  $: profile = deriveProfile(node.attrs.pubkey, node.attrs.relays)
</script>

<NodeViewWrapper class="inline">
  <Button on:click={onClick} class={cx("link-content", {"link-content-selected": selected})}>
    @{displayProfile($profile)}
  </Button>
</NodeViewWrapper>
