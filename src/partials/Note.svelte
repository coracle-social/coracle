<script>
  import cx from 'classnames'
  import extractUrls from 'extract-urls'
  import {whereEq, reject, propEq, find} from 'ramda'
  import {slide} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {quantify} from 'hurdak/lib/hurdak'
  import {hasParent} from 'src/util/html'
  import {findReply, isLike} from "src/util/nostr"
  import Preview from 'src/partials/Preview.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {settings, modal} from "src/app"
  import {formatTimestamp} from 'src/util/misc'
  import Badge from "src/partials/Badge.svelte"
  import Compose from "src/partials/Compose.svelte"
  import Card from "src/partials/Card.svelte"
  import {user, getPerson, getRelays} from 'src/agent'
  import cmd from 'src/app/cmd'

  export let note
  export let depth = 0
  export let anchorId = null
  export let showParent = true
  export let invertColors = false

  let reply = null

  const links = $settings.showLinkPreviews ? extractUrls(note.content) || [] : null
  const interactive = !anchorId || anchorId !== note.id

  let likes, flags, like, flag

  $: {
    likes = note.reactions.filter(n => isLike(n.content))
    flags = note.reactions.filter(whereEq({content: '-'}))
  }

  $: like = find(whereEq({pubkey: $user?.pubkey}), likes)
  $: flag = find(whereEq({pubkey: $user?.pubkey}), flags)

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !hasParent('a', e.target)) {
      modal.set({note})
    }
  }

  const goToParent = async () => {
    modal.set({note: {id: findReply(note)[1]}})
  }

  const react = async content => {
    if (!$user) {
      return navigate('/login')
    }

    const event = await cmd.createReaction(getRelays(), note, content)

    if (content === '+') {
      likes = likes.concat(event)
    }

    if (content === '-') {
      flags = flags.concat(event)
    }
  }

  const deleteReaction = e => {
    cmd.deleteEvent(getRelays(), [e.id])

    if (e.content === '+') {
      likes = reject(propEq('pubkey', $user.pubkey), likes)
    }

    if (e.content === '-') {
      flags = reject(propEq('pubkey', $user.pubkey), flags)
    }
  }

  const startReply = () => {
    if ($user) {
      reply = reply || true
    } else {
      navigate('/login')
    }
  }

  const sendReply = () => {
    const {content, mentions} = reply.parse()

    if (content) {
      cmd.createReply(getRelays(), note, content, mentions)

      reply = null
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
    <Badge person={getPerson(note.pubkey, true)} />
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 flex flex-col gap-2">
    {#if findReply(note) && showParent}
      <small class="text-light">
        Reply to <Anchor on:click={goToParent}>{findReply(note)[1].slice(0, 8)}</Anchor>
      </small>
    {/if}
    {#if flag}
    <p class="text-light border-l-2 border-solid border-medium pl-4">
      You have flagged this content as offensive.
      <Anchor on:click={() => deleteReaction(flag)}>Unflag</Anchor>
    </p>
    {:else}
    <div class="text-ellipsis overflow-hidden flex flex-col gap-2">
      <p>{@html note.html}</p>
      {#each links.slice(-2) as link}
      <div>
        <div class="inline-block" on:click={e => e.stopPropagation()}>
          <Preview endpoint={`${$settings.dufflepudUrl}/link/preview`} url={link} />
        </div>
      </div>
      {/each}
    </div>
    <div class="flex gap-6 text-light">
      <div>
        <i
          class="fa-solid fa-reply cursor-pointer"
          on:click={startReply} />
        {note.repliesCount}
      </div>
      <div class={cx({'text-accent': like})}>
        <i
          class="fa-solid fa-heart cursor-pointer"
          on:click={() => like ? deleteReaction(like) : react("+")} />
        {likes.length}
      </div>
      <div>
        <i class="fa-solid fa-flag cursor-pointer" on:click={() => react("-")} />
        {flags.length}
      </div>
    </div>
    {/if}
  </div>
</Card>

{#if reply}
<div
  class="note-reply bg-medium border-medium border border-solid"
  transition:slide>
  <Compose bind:this={reply} onSubmit={sendReply}>
    <div
      slot="addon"
      on:click={sendReply}
      class="flex flex-col py-8 p-4 justify-center gap-2 border-l border-solid border-dark
             hover:bg-accent transition-all cursor-pointer text-white ">
      <i class="fa-solid fa-paper-plane fa-xl" />
    </div>
  </Compose>
</div>
{/if}

{#if depth > 0}
<div class="ml-5 border-l border-solid border-medium">
  {#if note.repliesCount > 3 && note.replies.length < note.repliesCount}
  <div class="ml-5 py-2 text-light cursor-pointer" on:click={onClick}>
    <i class="fa-solid fa-up-down text-sm pr-2" />
    Show {quantify(note.repliesCount - note.replies.length, 'other reply', 'more replies')}
  </div>
  {/if}
  {#each note.replies as r (r.id)}
  <svelte:self showParent={false} note={r} depth={depth - 1} {invertColors} {anchorId} />
  {/each}
</div>
{/if}
