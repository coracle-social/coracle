<script lang="ts">
  import {deriveProfile} from "@welshman/app"
  import Content from "@app/components/Content.svelte"

  const {pubkey} = $props()

  const profile = deriveProfile(pubkey)
</script>

{#if $profile}
  <Content event={{content: $profile.about, tags: []}} />
{/if}
