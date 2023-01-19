<script>
  export let room
  export let setRoom
</script>

<div
  class="flex gap-4 px-2 py-4 cursor-pointer hover:bg-dark transition-all"
  on:click={() => setRoom(room.id)}>
  <div
    class="overflow-hidden w-20 h-20 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({room.picture})" />
  <div class="flex flex-col gap-2">
    <h2 class="text-lg">{room.name}</h2>
    {#if room.about}
    <p class="text-light whitespace-nowrap text-ellipsis overflow-hidden">
      {room.about}
    </p>
    {/if}
  </div>
</div>
