<script>
  import {take} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import {getTagValues} from "src/util/nostr"
  import Note from "src/partials/Note.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {user} from 'src/agent'
  import query from 'src/app/query'

  export let q

  let search

  onMount(async () => {
    const filter = {kinds: [1], muffle: getTagValues($user?.muffle || [])}

    search = fuzzy(take(5000, await query.filterEvents(filter)), {keys: ["content"]})
  })
</script>

{#if search}
<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#await Promise.all(search(q).slice(0, 30).map(n => query.findNote(n.id)))}
  <Spinner />
  {:then results}
    {#each results as e (e.id)}
    <li in:fly={{y: 20}}>
      <Note note={e} />
    </li>
    {/each}
  {/await}
</ul>
{:else}
<Spinner />
{/if}
