<script>
  import {fly} from 'svelte/transition'
  import {propEq} from 'ramda'
  import Note from "src/views/Note.svelte"
  import {findReply} from 'src/util/nostr'
  import relay from 'src/relay'

  export let author

  const notes = relay.lq(async () => {
    const reactions = await relay.db.events
      .where('pubkey').equals(author).filter(propEq('kind', 7)).toArray()

    return Promise.all(reactions.map(r => relay.findNote(findReply(r))))
  })
</script>

{#if $notes}
<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each $notes as n (n.id)}
    <li><Note interactive noReply note={n} depth={1} /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/each}
</ul>
{/if}
