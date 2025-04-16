<script lang="ts">
  import {removeNil} from "@welshman/lib"
  import {deriveProfile} from "@welshman/app"
  import Content from "@app/components/Content.svelte"

  export type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const profile = deriveProfile(pubkey, removeNil([url]))
</script>

{#if $profile}
  <Content event={{content: $profile.about, tags: []}} hideMediaAtDepth={0} />
{/if}
