<script>
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {fuzzy} from "src/util/misc"
  import {channels} from 'src/state/nostr'
  import Input from "src/partials/Input.svelte"

  let q = ""
  let rooms = []
  let search

  $: search = fuzzy(Object.values(rooms), {keys: ["name", "about"]})

  const createRoom = () => navigate(`/chat/new`)

  const setRoom = id => {
    navigate(`/chat/${id}`)
  }

  onMount(async () => {
    const events = await channels.getter.all({kinds: [40, 41]})

    events.forEach(e => {
      const id = e.kind === 40 ? e.id : e.tags[0][1]

      rooms[id] = {id, pubkey: e.pubkey, ...rooms[id], ...JSON.parse(e.content)}
    })
  })
</script>

<div class="flex flex-col bg-dark w-full sm:w-56 h-full fixed py-8 border-r border-solid border-r-medium">
  <div class="m-4">
    <Input bind:value={q} type="text" placeholder="Search rooms">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
  </div>
  <ul>
    {#each search(q).slice(0, 10) as r}
    <li
      class="flex flex-col gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-all"
      on:click={() => setRoom(r.id)}>
      <div class="flex gap-2 items-center">
        <div
          class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({r.picture})" />
        <span class="font-bold">{r.name}</span>
      </div>
      {#if r.about}
      <small class="pl-6 text-light whitespace-nowrap text-ellipsis overflow-hidden">
        {r.about}
      </small>
      {/if}
    </li>
    {/each}
    <li class="bg-medium m-3 h-px" />
    <li class="cursor-pointer font-bold hover:bg-accent transition-all px-3 py-2" on:click={createRoom}>
      <i class="fa-solid fa-plus" /> Create Room
    </li>
  </ul>
</div>

