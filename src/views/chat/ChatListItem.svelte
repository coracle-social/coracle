<script>
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {fly} from "svelte/transition"
  import {ellipsize} from "hurdak/lib/hurdak"
  import Anchor from "src/partials/Anchor.svelte"
  import database from "src/agent/database"

  export let room

  const enter = () => navigate(`/chat/${nip19.noteEncode(room.id)}`)
  const join = () => database.rooms.patch({id: room.id, joined: true})
  const leave = () => database.rooms.patch({id: room.id, joined: false})
</script>

<button
  class="flex cursor-pointer gap-4 rounded border border-solid border-medium bg-dark px-4 py-6 transition-all hover:bg-medium"
  on:click={enter}
  in:fly={{y: 20}}>
  <div
    class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-solid border-white bg-cover bg-center"
    style="background-image: url({room.picture})" />
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        <i class="fa fa-lock-open text-light" />
        <h2 class="text-lg">{room.name || ""}</h2>
      </div>
      {#if room.joined}
        <Anchor
          type="button"
          class="flex items-center gap-2"
          on:click={e => {
            e.stopPropagation()
            leave()
          }}>
          <i class="fa fa-right-from-bracket" />
          <span>Leave</span>
        </Anchor>
      {:else}
        <Anchor
          type="button"
          class="flex items-center gap-2"
          on:click={e => {
            e.stopPropagation()
            join()
          }}>
          <i class="fa fa-right-to-bracket" />
          <span>Join</span>
        </Anchor>
      {/if}
    </div>
    {#if room.about}
      <p class="text-start text-light">
        {ellipsize(room.about, 300)}
      </p>
    {/if}
  </div>
</button>
