<script lang="ts">
  import Content from "@app/components/Content.svelte"
  import {deriveAlias} from "@app/state"

  export type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const alias = deriveAlias(pubkey, url)
</script>

{#if $alias?.profile}
  <Content event={{content: $alias.profile.about, tags: []}} hideMediaAtDepth={0} />
{/if}
