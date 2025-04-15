<script lang="ts">
  import Content from "@app/components/Content.svelte"
  import {deriveAliasedProfile} from "@app/state"

  export type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const profile = deriveAliasedProfile(pubkey, url)
</script>

{#if $profile}
  <Content event={{content: $profile.about, tags: []}} hideMediaAtDepth={0} />
{/if}
