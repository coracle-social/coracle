<script>
  import {fly} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'

  export let joined = false
  export let room
  export let setRoom
  export let joinRoom
  export let leaveRoom
</script>

<li
  class="flex gap-4 px-4 py-6 cursor-pointer hover:bg-medium transition-all rounded border border-solid border-medium bg-dark"
  on:click={() => setRoom(room.id)}
  in:fly={{y: 20}}>
  <div
    class="overflow-hidden w-14 h-14 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({room.picture})" />
  <div class="flex flex-grow flex-col justify-start gap-2">
    <div class="flex flex-grow items-center justify-between gap-2">
      <h2 class="text-lg">{room.name}</h2>
      {#if joined}
      <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); leaveRoom(room.id) }}>
        <i class="fa fa-right-from-bracket" />
        <span>Leave</span>
      </Anchor>
      {:else}
      <Anchor type="button" class="flex items-center gap-2" on:click={e => { e.stopPropagation(); joinRoom(room.id) }}>
        <i class="fa fa-right-to-bracket" />
        <span>Join</span>
      </Anchor>
      {/if}
    </div>
    {#if room.about}
    <p class="text-light whitespace-nowrap text-ellipsis overflow-hidden">
      {room.about}
    </p>
    {/if}
  </div>
</li>
