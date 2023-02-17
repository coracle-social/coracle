<script>
  import {Link} from 'svelte-routing'
  import ImageCircle from 'src/partials/ImageCircle.svelte'
  import {killEvent} from 'src/util/html'
  import {displayPerson} from 'src/util/nostr'
  import {routes} from 'src/app/ui'

  export let person
  export let inert = false
</script>

{#if inert}
<span class="flex gap-2 items-center relative z-10">
  <ImageCircle src={person.kind0?.picture} />
  <span class="text-lg font-bold">{displayPerson(person)}</span>
</span>
{:else}
<Link
  to={routes.person(person.pubkey)}
  class="flex gap-2 items-center relative z-10"
  on:click={killEvent}>
  <ImageCircle src={person.kind0?.picture} />
  <span class="text-lg font-bold">{displayPerson(person)}</span>
</Link>
{/if}
