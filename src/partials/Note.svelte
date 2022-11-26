<script>
  import cx from 'classnames'
  import {onMount} from 'svelte'
  import {find, last, uniqBy, prop, whereEq} from 'ramda'
  import {fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {ellipsize} from 'hurdak/src/core'
  import {hasParent} from 'src/util/html'
  import Anchor from 'src/partials/Anchor.svelte'
  import {nostr} from "src/state/nostr"
  import {dispatch, t} from "src/state/dispatch"
  import {accounts, modal} from "src/state/app"
  import {user} from "src/state/user"
  import {formatTimestamp} from 'src/util/misc'
  import UserBadge from "src/partials/UserBadge.svelte"

  export let note
  export let isReply = false
  export let interactive = false
  export let invertColors = false

  let like = null
  let flag = null
  let reply = null
  let parentId

  $: {
    like = find(e => e.pubkey === $user.pubkey && e.content === "+", note.reactions)
    flag = find(e => e.pubkey === $user.pubkey && e.content === "-", note.reactions)
    parentId = prop(1, find(t => last(t) === 'reply' ? t[1] : null, note.tags))
  }

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      modal.set({note})
    }
  }

  const showParent = () => {
    modal.set({note: {id: parentId}})
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

  const startReply = () => {
    if ($user) {
      reply = reply || ''
    } else {
      navigate('/login')
    }
  }

  const sendReply = () => {
    if (reply) {
      dispatch("reply/create", reply, note)

      reply = null
    }
  }

  const onReplyKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }
</script>

<svelte:body
  on:click={e => {
    if (!hasParent('.fa-reply', e.target) && !hasParent('.note-reply', e.target)) {
      reply = null
    }
  }}
  on:keydown={e => {
    if (e.key === 'Escape') {
      reply = null
    }
  }}
/>

<div
  in:fly={{y: 20}}
  on:click={onClick}
  class={cx("py-2 px-3 flex flex-col gap-2 text-white", {
    "cursor-pointer transition-all": interactive,
    "border border-solid border-black hover:border-medium hover:bg-dark": interactive && !invertColors,
    "border border-solid border-dark hover:border-medium hover:bg-medium": interactive && invertColors,
  })}>
  <div class="flex gap-4 items-center justify-between">
    <UserBadge user={$accounts[note.pubkey]} />
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 flex flex-col gap-2">
    {#if parentId && !isReply}
      <small class="text-light">
        Reply to <Anchor on:click={showParent}>{parentId.slice(0, 8)}</Anchor>
      </small>
    {/if}
    <p>{ellipsize(note.content, 240)}</p>
    <div class="flex gap-6 text-light">
      <div>
        <i
          class="fa-solid fa-reply cursor-pointer"
          on:click={startReply} />
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
</div>

{#if reply !== null}
<div
  class="note-reply flex bg-medium border-medium border border-solid"
  transition:fly={{y: 20}}>
  <textarea
    rows="4"
    autofocus
    placeholder="Type something..."
    bind:value={reply}
    on:keypress={onReplyKeyPress}
    class="w-full p-2 text-white bg-medium
           placeholder:text-light outline-0 resize-none" />
  <div
    on:click={sendReply}
    class="flex flex-col py-8 p-4 justify-center gap-2 border-l border-solid border-dark
           hover:bg-accent transition-all cursor-pointer text-white ">
    <i class="fa-solid fa-paper-plane fa-xl" />
  </div>
</div>
{/if}
