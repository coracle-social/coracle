<script>
  import cx from 'classnames'
  import extractUrls from 'extract-urls'
  import {nip19} from 'nostr-tools'
  import {whereEq, without, uniq, pluck, reject, propEq, find} from 'ramda'
  import {slide} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {quantify} from 'hurdak/lib/hurdak'
  import {Tags, findReply, findReplyId, displayPerson, isLike} from "src/util/nostr"
  import Preview from 'src/partials/Preview.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {settings, modal, render} from "src/app"
  import {formatTimestamp} from 'src/util/misc'
  import Badge from "src/partials/Badge.svelte"
  import Compose from "src/partials/Compose.svelte"
  import Card from "src/partials/Card.svelte"
  import {user, people, getPerson, getRelays, getEventRelays} from 'src/agent'
  import cmd from 'src/app/cmd'

  export let note
  export let depth = 0
  export let anchorId = null
  export let showParent = true
  export let invertColors = false

  let reply = null
  let replyMentions = without([$user?.pubkey], Tags.from(note).type("p").values().all())

  const links = $settings.showLinkPreviews ? extractUrls(note.content) || [] : null
  const showEntire = anchorId === note.id
  const interactive = !anchorId || !showEntire
  const relays = getEventRelays(note)

  let likes, flags, like, flag, person

  $: person = $people[note.pubkey] || {pubkey: note.pubkey}

  $: {
    likes = note.reactions.filter(n => isLike(n.content))
    flags = note.reactions.filter(whereEq({content: '-'}))
  }

  $: like = find(whereEq({pubkey: $user?.pubkey}), likes)
  $: flag = find(whereEq({pubkey: $user?.pubkey}), flags)

  const onClick = e => {
    if (!['I'].includes(e.target.tagName) && !e.target.closest('a')) {
      modal.set({type: 'note', note, relays})
    }
  }

  const goToParent = async () => {
    const [id, url] = findReply(note).slice(1)
    const relays = getEventRelays(note).concat({url})

    modal.set({type: 'note', note: {id}, relays})
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

  const removeMention = pubkey => {
    replyMentions = without([pubkey], replyMentions)
  }

  const resetReply = () => {
    reply = null
    replyMentions = Tags.from(note).type("p").values().all()
  }

  const sendReply = () => {
    let {content, mentions, topics} = reply.parse()

    if (content) {
      mentions = uniq(mentions.concat(replyMentions))
      cmd.createReply(getEventRelays(note), note, content, mentions, topics)

      resetReply()
    }
  }
</script>

<svelte:body
  on:click={e => {
    if (!e.target.closest('.fa-reply') && !e.target.closest('.note-reply')) {
      resetReply()
    }
  }}
  on:keydown={e => {
    if (e.key === 'Escape') {
      resetReply()
    }
  }}
/>

<Card on:click={onClick} {interactive} {invertColors}>
  <div class="flex gap-4 items-center justify-between">
    <Badge person={person} />
    <Anchor
      href={"/" + nip19.neventEncode({id: note.id, relays: pluck('url', relays)})}
      class="text-sm text-light"
      type="unstyled">
      {formatTimestamp(note.created_at)}
    </Anchor>
  </div>
  <div class="ml-6 flex flex-col gap-2">
    {#if findReply(note) && showParent}
      <small class="text-light">
        Reply to <Anchor on:click={goToParent}>{findReplyId(note).slice(0, 8)}</Anchor>
      </small>
    {/if}
    {#if flag}
    <p class="text-light border-l-2 border-solid border-medium pl-4">
      You have flagged this content as offensive.
      <Anchor on:click={() => deleteReaction(flag)}>Unflag</Anchor>
    </p>
    {:else}
    <div class="text-ellipsis overflow-hidden flex flex-col gap-2">
      <p>{@html render(note, {showEntire})}</p>
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
        {note.replies.length}
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
<div transition:slide class="note-reply">
  <div class="bg-medium border-medium border border-solid">
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
  {#if replyMentions.length > 0}
  <div class="text-white text-sm p-2 rounded-b border-t-0 border border-solid border-medium">
    <div class="inline-block border-r border-solid border-medium pl-1 pr-3 mr-2">
      <i class="fa fa-at" />
    </div>
    {#each replyMentions as p}
      <div class="inline-block py-1 px-2 mr-1 mb-2 rounded-full border border-solid border-light">
        <i class="fa fa-times cursor-pointer" on:click|stopPropagation={() => removeMention(p)} />
        {displayPerson(getPerson(p, true))}
      </div>
    {/each}
    <div class="-mt-2" />
  </div>
  {/if}
</div>
{/if}

{#if depth > 0}
<div class="ml-5 border-l border-solid border-medium">
  {#if !showEntire && note.replies.length > 3}
  <div class="ml-5 py-2 text-light cursor-pointer" on:click={onClick}>
    <i class="fa-solid fa-up-down text-sm pr-2" />
    Show {quantify(note.replies.length - 3, 'other reply', 'more replies')}
  </div>
  {/if}
  {#each note.replies.slice(showEntire ? 0 : -3) as r (r.id)}
  <svelte:self showParent={false} note={r} depth={depth - 1} {invertColors} {anchorId} />
  {/each}
</div>
{/if}
