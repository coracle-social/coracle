<script>
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {ellipsize} from 'hurdak/src/core'
  import {hasParent} from 'src/util/html'
  import {accounts} from "src/state/app"
  import {formatTimestamp} from 'src/util/misc'
  import UserBadge from "src/partials/UserBadge.svelte"

  export let note

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      navigate(`/notes/${note.id}`)
    }
  }
</script>

<li
  in:fly={{y: 20}}
  on:click={onClick}
  class="py-2 px-3 chat-message flex flex-col gap-2 hover:bg-dark border border-solid border-black hover:border-medium transition-all cursor-pointer">
  <div class="flex gap-4 items-center justify-between">
    <UserBadge user={$accounts[note.pubkey]} />
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 flex flex-col gap-2">
    <p>{ellipsize(note.content, 240)}</p>
    <div class="flex gap-6 text-light">
      <i class="fa-solid fa-reply cursor-pointer" />
      <i class="fa-solid fa-heart cursor-pointer" />
      <i class="fa-solid fa-flag cursor-pointer" />
    </div>
  </div>
</li>
