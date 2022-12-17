<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import {user} from "src/state/user"
  import relay from 'src/relay'

  export let q

  let results = []

  const search = relay.lq(async () => {
    return fuzzy(await relay.db.users.toArray(), {keys: ["name", "about", "pubkey"]})
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
  {#each results as e (e.pubkey)}
    {#if e.pubkey !== $user.pubkey}
    <li in:fly={{y: 20}}>
      <a href="/users/{e.pubkey}/notes" class="flex gap-4 my-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({e.picture})" />
        <div class="flex-grow">
          <h1 class="text-2xl">{e.name || e.pubkey.slice(0, 8)}</h1>
          <p>{e.about || ''}</p>
        </div>
      </a>
    <li>
    {/if}
  {/each}
</ul>
