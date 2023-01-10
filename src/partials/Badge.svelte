<script>
  import {Link} from 'svelte-routing'
  import {killEvent} from 'src/util/html'
  import {displayPerson} from 'src/util/nostr'
  import {routes} from 'src/app/ui'

  export let person
  export let inert = false
</script>

{#if inert}
<span class="flex gap-2 items-center relative z-10">
  <div
    class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({person.picture})" />
  <span class="text-lg font-bold">{displayPerson(person)}</span>
</span>
{:else}
<Link
  to={routes.person(person.pubkey)}
  class="flex gap-2 items-center relative z-10"
  on:click={killEvent}>
  <div
    class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({person.picture})" />
  <span class="text-lg font-bold">{displayPerson(person)}</span>
</Link>
{/if}
