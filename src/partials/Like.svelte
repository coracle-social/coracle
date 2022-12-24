<script>
  import {fly} from 'svelte/transition'
  import {ellipsize, quantify} from 'hurdak/src/core'
  import Badge from "src/partials/Badge.svelte"
  import {formatTimestamp} from 'src/util/misc'
  import {modal} from 'src/state/app'

  export let note

  let isOpen = false

  const openPopover = e => {
    e.stopPropagation()

    isOpen = true
  }

  const closePopover = e => {
    e.stopPropagation()

    isOpen = false
  }
</script>

<div
  class="py-2 px-3 flex flex-col gap-2 text-white cursor-pointer transition-all
         border border-solid border-black hover:border-medium hover:bg-dark"
  on:click={() => modal.set({note})}>
  <div class="flex gap-2 items-center justify-between relative">
    <span class="cursor-pointer" on:click={openPopover}>
      {quantify(note.people.length, 'person', 'people')} liked your note.
    </span>
    {#if isOpen}
    <div transition:fly={{y: 20}} class="fixed inset-0 z-10" on:click={closePopover} />
    <div
      transition:fly={{y: 20}}
      class="absolute top-0 mt-8 py-2 px-4 rounded border border-solid border-medium
             bg-dark grid grid-cols-3 gap-y-2 gap-x-4 z-20">
      {#each note.people as person (person.pubkey)}
        <Badge {person} />
      {/each}
    </div>
    {/if}
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 text-light">
    {ellipsize(note.content, 120)}
  </div>
</div>
