<script>
  import cx from 'classnames'
  import {onMount} from 'svelte'
  import {find, uniqBy, prop, whereEq} from 'ramda'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {ellipsize} from 'hurdak/src/core'
  import {hasParent} from 'src/util/html'
  import {nostr} from "src/state/nostr"
  import {dispatch} from "src/state/dispatch"
  import {accounts, modal} from "src/state/app"
  import {user} from "src/state/user"
  import {formatTimestamp} from 'src/util/misc'
  import UserBadge from "src/partials/UserBadge.svelte"

  export let note
  export let interactive = false

  let like = null
  let flag = null

  $: {
    like = find(e => e.pubkey === $user.pubkey && e.content === "+", note.reactions)
  }

  $: {
    flag = find(e => e.pubkey === $user.pubkey && e.content === "-", note.reactions)
  }

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      modal.set({note})
    }
  }

  const react = content => {
    if ($user) {
      dispatch('reaction/create', content, note)
    } else {
      navigate('/login')
    }
  }

  const deleteReaction = e => {
    dispatch('event/delete', [e.id])
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
      <div>
        <i class="fa-solid fa-reply cursor-pointer" />
        {note.replies.length}
      </div>
      <div class={cx({'text-accent': like})}>
        <i
          class="fa-solid fa-heart cursor-pointer"
          on:click={() => like ? deleteReaction(like) : react("+")} />
        {uniqBy(prop('pubkey'), note.reactions.filter(whereEq({content: '+'}))).length}
      </div>
      <div class={cx({'text-accent': flag})}>
        <i
          class="fa-solid fa-flag cursor-pointer"
          on:click={() => flag ? deleteReaction(flag) : react("-")} />
        {uniqBy(prop('pubkey'), note.reactions.filter(whereEq({content: '-'}))).length}
      </div>
    </div>
  </div>
</li>
