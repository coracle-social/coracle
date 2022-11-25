<script>
  import cx from 'classnames'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {ellipsize} from 'hurdak/src/core'
  import {hasParent} from 'src/util/html'
  import {accounts, modal} from "src/state/app"
  import {formatTimestamp} from 'src/util/misc'
  import UserBadge from "src/partials/UserBadge.svelte"

  export let note
  export let interactive = false

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      modal.set({note})
    }
  }
</script>

<li
  in:fly={{y: 20}}
  on:click={onClick}
  class={cx("py-2 px-3 flex flex-col gap-2 text-white", {
    "hover:bg-dark transition-all cursor-pointer": interactive,
    "border border-solid border-black hover:border-medium": interactive,
  })}>
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
