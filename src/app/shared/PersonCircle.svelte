<script lang="ts">
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"
  import {derivePerson} from "src/engine"

  export let pubkey

  const klass = $$props.class || "w-4 h-4"
  const person = derivePerson(pubkey)
</script>

{#if $person.profile?.picture}
  <ImageCircle src={$person.profile.picture} class={klass} />
{:else}
  <PlaceholderCircle {pubkey} class={klass} />
{/if}
