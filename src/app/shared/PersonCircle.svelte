<script lang="ts">
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {derivePerson} from "src/engine"

  export let pubkey
  export let size = 4

  const person = derivePerson(pubkey)
</script>

{#if $person.profile?.picture}
  <ImageCircle {size} src={$person.profile.picture} class={$$props.class} />
{:else}
  <PlaceholderCircle {pubkey} {size} class={$$props.class} />
{/if}
