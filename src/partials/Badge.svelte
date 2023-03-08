<script>
  import {Link} from "svelte-routing"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {killEvent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import {routes} from "src/app/ui"

  export let person
  export let inert = false
</script>

{#if inert}
  <span class="relative z-10 flex items-center gap-2">
    <ImageCircle src={person.kind0?.picture} />
    <span class="text-lg font-bold">{displayPerson(person)}</span>
  </span>
{:else}
  <Link
    to={routes.person(person.pubkey)}
    class="relative z-10 flex items-center gap-2"
    on:click={killEvent}>
    <ImageCircle src={person.kind0?.picture} />
    <span class="text-lg font-bold">{displayPerson(person)}</span>
  </Link>
{/if}
