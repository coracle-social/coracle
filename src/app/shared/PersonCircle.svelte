<script lang="ts">
  import {defaultTo} from "ramda"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {Directory} from "src/app/engine"

  export let pubkey
  export let size = 4

  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
</script>

{#if $profile.picture}
  <ImageCircle {size} src={$profile.picture} class={$$props.class} />
{:else}
  <PlaceholderCircle {pubkey} {size} class={$$props.class} />
{/if}
