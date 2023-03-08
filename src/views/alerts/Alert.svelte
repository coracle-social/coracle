<script>
  import {fly} from "svelte/transition"
  import {ellipsize, quantify, switcher} from "hurdak/lib/hurdak"
  import Badge from "src/partials/Badge.svelte"
  import {formatTimestamp} from "src/util/misc"
  import {killEvent} from "src/util/html"
  import database from "src/agent/database"
  import {modal} from "src/app/ui"

  export let note
  export let type

  const pubkeys = switcher(type, {
    replies: note.repliesFrom,
    likes: note.likedBy,
    zaps: note.zappedBy,
  })

  const actionText = switcher(type, {
    replies: "replied to your note",
    likes: "liked your note",
    zaps: "zapped your note",
  })

  let isOpen = false

  const openPopover = e => {
    killEvent(e)

    isOpen = true
  }

  const closePopover = e => {
    killEvent(e)

    isOpen = false
  }
</script>

<button
  class="flex w-full cursor-pointer flex-col gap-2 border border-solid border-black py-2
         px-3 text-left text-white transition-all hover:border-medium hover:bg-dark"
  on:click={() => modal.set({type: "note/detail", note})}>
  <div class="relative flex w-full items-center justify-between gap-2">
    <button class="cursor-pointer" on:click={openPopover}>
      {quantify(pubkeys.length, "person", "people")}
      {actionText}.
    </button>
    {#if isOpen}
      <button in:fly={{y: 20}} class="fixed inset-0 z-10" on:click={closePopover} />
      <button
        on:click={killEvent}
        in:fly={{y: 20}}
        class="absolute top-0 z-20 mt-8 grid grid-cols-2 gap-y-2 gap-x-4 rounded
             border border-solid border-medium bg-dark py-2 px-4">
        {#each pubkeys as pubkey}
          <Badge person={database.getPersonWithFallback(pubkey)} />
        {/each}
      </button>
    {/if}
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 text-light">
    {ellipsize(note.content, 120)}
  </div>
</button>
