<script>
  import {take} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Note from "src/partials/Note.svelte"
  import Spinner from "src/partials/Spinner.svelte"

  export let q

  let search

  onMount(async () => {
    search = fuzzy(
      take(5000, await relay.filterEvents({kinds: [1]})),
      {keys: ["content"]}
    )
  })
</script>

{#if search}
<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#await Promise.all(search(q).slice(0, 30).map(n => relay.findNote(n.id)))}
  <Spinner />
  {:then results}
    {#each results as e (e.id)}
    <li in:fly={{y: 20}}>
      <Note interactive note={e} />
    </li>
    {/each}
  {/await}
</ul>
{:else}
<Spinner />
{/if}
