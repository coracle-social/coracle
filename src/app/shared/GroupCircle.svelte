<script lang="ts">
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {deriveGroupMeta} from "src/engine"

  export let address

  const meta = deriveGroupMeta(address)
</script>

{#if $meta?.image}
  <ImageCircle src={$meta.image} class={$$props.class} />
{:else}
  <PlaceholderCircle pubkey={address} class={$$props.class} />
{/if}
