<script>
  import cx from 'classnames'
  import {find, uniqBy, prop, whereEq} from 'ramda'
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {ellipsize} from 'hurdak/src/core'
  import {hasParent, findLink} from 'src/util/html'
  import {renderNote} from 'src/util/notes'
  import Preview from 'src/partials/Preview.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {dispatch} from "src/state/dispatch"
  import {findReply} from "src/state/nostr"
  import {accounts, settings, modal} from "src/state/app"
  import {user} from "src/state/user"
  import {formatTimestamp} from 'src/util/misc'
  import UserBadge from "src/partials/UserBadge.svelte"
  import Card from "src/partials/Card.svelte"

  export let note
  export let depth = 0
  export let anchorId = null
  export let showParent = false
  export let showEntire = false
  export let invertColors = false

  let link = null
  let like = null
  let flag = null
  let reply = null
  let interactive = null

  $: {
    like = find(e => e.pubkey === $user?.pubkey && e.content === "+", note.reactions)
    flag = find(e => e.pubkey === $user?.pubkey && e.content === "-", note.reactions)
    interactive = !anchorId || anchorId !== note.id
  }

  onMount(async () => {
    link = $settings.showLinkPreviews ? findLink(note.content) : null
  })

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      modal.set({note})
    }
  }

  const goToParent = () => {
    const parentId = findReply(note)

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

<Card on:click={onClick} {interactive} {invertColors}>
  <div class="flex gap-4 items-center justify-between">
    <UserBadge user={{...$accounts[note.pubkey], pubkey: note.pubkey}} />
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 flex flex-col gap-2">
    {#if findReply(note) && showParent}
      <small class="text-light">
        Reply to <Anchor on:click={goToParent}>{findReply(note).slice(0, 8)}</Anchor>
      </small>
    {/if}
    {#if flag}
    <p class="text-light border-l-2 border-solid border-medium pl-4">
      You have flagged this content as offensive.
      <Anchor on:click={() => deleteReaction(flag)}>Unflag</Anchor>
    </p>
    {:else}
    <p class="text-ellipsis overflow-hidden">
      {@html renderNote(note, {showEntire})}
      {#if link}
      <div class="mt-2" on:click={e => e.stopPropagation()}>
        <Preview endpoint={`${$settings.dufflepudUrl}/link/preview`} url={link} />
      </div>
      {/if}
    </p>
    <div class="flex gap-6 text-light">
      <div>
        <i
          class="fa-solid fa-reply cursor-pointer"
          on:click={startReply} />
        {note.children.length}
      </div>
      <div class={cx({'text-accent': like})}>
        <i
          class="fa-solid fa-heart cursor-pointer"
          on:click={() => like ? deleteReaction(like) : react("+")} />
        {uniqBy(prop('pubkey'), note.reactions.filter(whereEq({content: '+'}))).length}
      </div>
      <div>
        <i class="fa-solid fa-flag cursor-pointer" on:click={() => react("-")} />
        {uniqBy(prop('pubkey'), note.reactions.filter(whereEq({content: '-'}))).length}
      </div>
    </div>
    {/if}
  </div>
</Card>

{#if reply !== null}
<div
  class="note-reply flex bg-medium border-medium border border-solid"
  transition:slide>
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

{#if depth > 0}
{#each uniqBy(prop('id'), note.children) as child (child.id)}
<div class="ml-5 border-l border-solid border-medium">
  <svelte:self note={child} depth={depth - 1} {invertColors} {anchorId} />
</div>
{/each}
{/if}
