<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Note from "src/views/Note.svelte"
  import relay from 'src/relay'

  export let q

  let results = []

  const search = relay.lq(async () => {
    const notes = await relay.filterEvents({kinds: [1]})
      .limit(5000).reverse().sortBy('created_at')

    return fuzzy(notes, {keys: ["content"]})
  })

  $: {
    if ($search) {
      Promise.all(
        $search(q).map(n => relay.findNote(n.id))
      ).then(notes => {
        results = notes
      })
    }
  }
</script>

<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each results.slice(0, 50) as e (e.id)}
    <li in:fly={{y: 20}}>
      <Note interactive note={e} />
    </li>
  {/each}
</ul>
