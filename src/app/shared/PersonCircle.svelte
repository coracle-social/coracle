<script lang="ts">
  import {deriveProfile} from "@welshman/app"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"

  export let pubkey

  const klass = $$props.class || "w-4 h-4"
  const profile = deriveProfile(pubkey)
</script>

{#if $profile?.picture}
  <ImageCircle src={$profile.picture} class={klass} />
{:else}
  <PlaceholderCircle {pubkey} class={klass} />
{/if}
