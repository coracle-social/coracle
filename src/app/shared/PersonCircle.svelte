<script lang="ts">
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {deriveProfile} from "src/engine"

  export let pubkey

  const klass = $$props.class || "w-4 h-4"
  const profile = deriveProfile(pubkey)
</script>

{#if $profile?.picture}
  <ImageCircle src={$profile.picture} class={klass} />
{:else}
  <PlaceholderCircle {pubkey} class={klass} />
{/if}
