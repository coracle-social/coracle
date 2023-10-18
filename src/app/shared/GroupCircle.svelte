<script lang="ts">
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {groups} from "src/engine"

  export let address

  const group = groups.key(address)
</script>

{#if $group?.image}
  <ImageCircle src={$group.image} class={$$props.class} />
{:else}
  <PlaceholderCircle pubkey={address} class={$$props.class} />
{/if}
