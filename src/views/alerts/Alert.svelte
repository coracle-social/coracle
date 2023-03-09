<script>
  import {ellipsize, quantify, switcher} from "hurdak/lib/hurdak"
  import Badge from "src/partials/Badge.svelte"
  import Popover from "src/partials/Popover.svelte"
  import {formatTimestamp} from "src/util/misc"
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
</script>

<button
  class="flex w-full cursor-pointer flex-col gap-2 border border-solid border-black py-2
         px-3 text-left text-white transition-all hover:border-medium hover:bg-dark"
  on:click={() => modal.set({type: "note/detail", note})}>
  <div class="relative flex w-full items-center justify-between gap-2" on:click|stopPropagation>
    <Popover>
      <div slot="trigger">
        {quantify(pubkeys.length, "person", "people")}
        {actionText}.
      </div>
      <div slot="tooltip">
        <div class="grid grid-cols-2 gap-y-2 gap-x-4">
          {#each pubkeys as pubkey}
            <Badge person={database.getPersonWithFallback(pubkey)} />
          {/each}
        </div>
      </div>
    </Popover>
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 text-light">
    {ellipsize(note.content, 120)}
  </div>
</button>
