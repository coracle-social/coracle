<script>
  import {nip19} from 'nostr-tools'
  import {navigate} from 'svelte-routing'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import Anchor from 'src/partials/Anchor.svelte'
  import database from 'src/agent/database'

  export let room

  const enter = () => navigate(`/chat/${nip19.noteEncode(room.id)}`)
  const join = () => database.rooms.patch({id: room.id, joined: true})
  const leave = () => database.rooms.patch({id: room.id, joined: false})
</script>

<button
  class="flex gap-4 px-4 py-6 cursor-pointer hover:bg-medium transition-all rounded border border-solid border-medium bg-dark"
  on:click={enter}
  in:fly={{y: 20}}>
  <div
    class="overflow-hidden w-14 h-14 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({room.picture})" />
  <div class="flex flex-grow flex-col justify-start gap-2 min-w-0">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex gap-2 items-center overflow-hidden">
        <i class="fa fa-lock-open text-light" />
        <h2 class="text-lg">{room.name || ''}</h2>
      </div>
      {#if room.joined}
      <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); leave() }}>
        <i class="fa fa-right-from-bracket" />
        <span>Leave</span>
      </Anchor>
      {:else}
      <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); join() }}>
        <i class="fa fa-right-to-bracket" />
        <span>Join</span>
      </Anchor>
      {/if}
    </div>
    {#if room.about}
    <p class="text-light text-start">
      {ellipsize(room.about, 300)}
    </p>
    {/if}
  </div>
</button>
