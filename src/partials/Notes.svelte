<script>
  import {liveQuery} from 'dexie'
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {uniqBy, sortBy, reject, prop} from 'ramda'
  import {createScroller, getMuffleValue, threadify, notesListener} from "src/util/notes"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import relay from 'src/relay'
  import {modal} from "src/state/app"

  export let filter
  export let shouldMuffle = false

  const notes = liveQuery(() => relay.filterEvents(filter).toArray())
</script>

<!-- <svelte:window on:scroll={scroller?.start} /> -->

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li>{n.content}</li>
    <!-- <li><Note interactive note={n} depth={2} /></li> -->
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/each}
</ul>
