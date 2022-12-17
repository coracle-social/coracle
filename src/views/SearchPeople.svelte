<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import {user} from "src/state/app"
  import relay from 'src/relay'

  export let q

  let search

  const people = relay.lq(() => relay.db.people.toArray())

  $: search = fuzzy($people || [], {keys: ["name", "about", "pubkey"]})
</script>

{#if search}
<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each search(q) as p (p.pubkey)}
    {#if p.pubkey !== $user.pubkey}
    <li in:fly={{y: 20}}>
      <a href="/people/{p.pubkey}/notes" class="flex gap-4 my-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({p.picture})" />
        <div class="flex-grow">
          <h1 class="text-2xl">{p.name || p.pubkey.slice(0, 8)}</h1>
          <p>{p.about || ''}</p>
        </div>
      </a>
    <li>
    {/if}
  {/each}
</ul>
{/if}
