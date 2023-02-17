<script lang="ts">
  import cx from 'classnames'
  import {nip19} from 'nostr-tools'
  import {last, always, whereEq, without, uniq, pluck, reject, propEq, find} from 'ramda'
  import {onMount} from 'svelte'
  import {tweened} from 'svelte/motion'
  import {slide} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {quantify} from 'hurdak/lib/hurdak'
  import {Tags, findReply, findRoot, findRootId, findReplyId, displayPerson, isLike} from "src/util/nostr"
  import {extractUrls} from "src/util/html"
  import ImageCircle from 'src/partials/ImageCircle.svelte'
  import Preview from 'src/partials/Preview.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {toast, settings, modal} from "src/app/ui"
  import {renderNote} from "src/app"
  import {formatTimestamp, stringToColor} from 'src/util/misc'
  import Compose from "src/partials/Compose.svelte"
  import Card from "src/partials/Card.svelte"
  import {user} from 'src/agent/user'
  import {getEventPublishRelays, getRelaysForEventParent} from 'src/agent/relays'
  import database from 'src/agent/database'
  import cmd from 'src/agent/cmd'
  import {routes} from 'src/app/ui'

  export let note
  export let anchorId = null
  export let showParent = true
  export let invertColors = false
  export let shouldDisplay = always(true)

  const getDefaultReplyMentions = () =>
    without([$user?.pubkey], uniq(Tags.from(note).type("p").values().all().concat(note.pubkey)))

  let reply = null
  let replyMentions = getDefaultReplyMentions()
  let replyContainer = null

  const links = $settings.showLinkPreviews ? extractUrls(note.content) || [] : []
  const showEntire = anchorId === note.id
  const interactive = !anchorId || !showEntire
  const person = database.watch('people', () => database.getPersonWithFallback(note.pubkey))

  let likes, flags, like, flag, border, childrenContainer, noteContainer

  const interpolate = (a, b) => t => a + Math.round((b - a) * t)
  const likesCount = tweened(0, {interpolate})
  const flagsCount = tweened(0, {interpolate})
  const repliesCount = tweened(0, {interpolate})

  $: {
    likes = note.reactions.filter(n => isLike(n.content))
    flags = note.reactions.filter(whereEq({content: '-'}))
  }

  $: like = find(whereEq({pubkey: $user?.pubkey}), likes)
  $: flag = find(whereEq({pubkey: $user?.pubkey}), flags)

  $: $likesCount = likes.length
  $: $flagsCount = flags.length
  $: $repliesCount = note.replies.length

  const onClick = e => {
    const target = e.target as HTMLElement

    if (interactive && !['I'].includes(target.tagName) && !target.closest('a')) {
      modal.set({type: 'note/detail', note})
    }
  }

  const goToParent = async () => {
    const relays = getRelaysForEventParent(note)

    modal.set({type: 'note/detail', note: {id: findReplyId(note)}, relays})
  }

  const goToRoot = async () => {
    const relays = getRelaysForEventParent(note)

    modal.set({type: 'note/detail', note: {id: findRootId(note)}, relays})
  }

  const showActiveRelays = () => {
    modal.set({type: 'relay/list', relays: [{url: note.seen_on}]})
  }

  const react = async content => {
    if (!$user) {
      return navigate('/login')
    }

    const relays = getEventPublishRelays(note)
    const [event] = cmd.createReaction(relays, note, content)

    if (content === '+') {
      likes = likes.concat(event)
    }

    if (content === '-') {
      flags = flags.concat(event)
    }
  }

  const deleteReaction = e => {
    cmd.deleteEvent(getEventPublishRelays(note), [e.id])

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
    replyMentions = getDefaultReplyMentions()
  }

  const sendReply = () => {
    let {content, mentions, topics} = reply.parse()

    if (content) {
      mentions = uniq(mentions.concat(replyMentions))

      const relays = getEventPublishRelays(note)
      const [event] = cmd.createReply(relays, note, content, mentions, topics)

      toast.show("info", {
        text: `Your note has been created!`,
        link: {
          text: 'View',
          href: "/" + nip19.neventEncode({
            id: event.id,
            relays: pluck('url', relays.slice(0, 3)),
          }),
        },
      })

      resetReply()
    }
  }

  const onBodyClick = e => {
    const target = e.target as HTMLElement

    if (replyContainer && !replyContainer.contains(target)) {
      resetReply()
    }
  }

  const setBorderHeight = () => {
    const getHeight = e => e?.getBoundingClientRect().height || 0

    if (childrenContainer && noteContainer) {
      const lastChild = last(
        [].slice.apply(childrenContainer.children)
          .filter(e => e.matches('.note'))
      )

      const height = (
        getHeight(noteContainer)
        + getHeight(replyContainer)
        + getHeight(childrenContainer)
        - getHeight(lastChild)
        - getHeight(lastChild.nextElementSibling)
      )

      border.style = `height: ${height - 21}px`
    }
  }

  onMount(() => {
    const interval = setInterval(setBorderHeight, 300)

    return () => clearInterval(interval)
  })
</script>

<svelte:body
  on:click={onBodyClick}
  on:keydown={e => {
    if (e.key === 'Escape') {
      resetReply()
    }
  }}
/>

{#if $person && shouldDisplay(note)}
<div bind:this={noteContainer} class="note relative">
  <div class="absolute w-px bg-light z-10 ml-8 mt-12 transition-all h-0" bind:this={border} />
  <Card class="flex gap-4 relative" on:click={onClick} {interactive} {invertColors}>
    {#if !showParent}
    <div class="absolute h-px w-3 bg-light z-10" style="left: 0px; top: 27px;" />
    {/if}
    <Anchor class="text-lg font-bold" href={routes.person($person.pubkey)}>
      <ImageCircle size={10} src={$person.picture} />
    </Anchor>
    <div class="flex flex-col gap-2 flex-grow min-w-0">
      <div class="flex items-center justify-between">
        <Anchor type="unstyled" class="text-lg font-bold flex gap-2 items-center" href={routes.person($person.pubkey)}>
          <span>{displayPerson($person)}</span>
          {#if $person.verified_as}
          <i class="fa fa-circle-check text-accent text-sm" />
          {/if}
        </Anchor>
        <Anchor
          href={"/" + nip19.neventEncode({id: note.id, relays: [note.seen_on]})}
          class="text-sm text-light"
          type="unstyled">
          {formatTimestamp(note.created_at)}
        </Anchor>
      </div>
      <div class="flex flex-col gap-2">
        {#if findReply(note) && showParent}
          <small class="text-light">
            Reply to <Anchor on:click={goToParent}>{findReplyId(note).slice(0, 8)}</Anchor>
          </small>
        {/if}
        {#if findRoot(note) && findRoot(note) !== findReply(note) && showParent}
          <small class="text-light">
            Go to <Anchor on:click={goToRoot}>root</Anchor>
          </small>
        {/if}
        {#if flag}
        <p class="text-light border-l-2 border-solid border-medium pl-4">
          You have flagged this content as offensive.
          <Anchor on:click={() => deleteReaction(flag)}>Unflag</Anchor>
        </p>
        {:else}
        <div class="text-ellipsis overflow-hidden flex flex-col gap-2">
          <p>{@html renderNote(note, {showEntire})}</p>
          {#each links.slice(-2) as link}
          <button class="inline-block" on:click={e => e.stopPropagation()}>
            <Preview endpoint={`${$settings.dufflepudUrl}/link/preview`} url={link} />
          </button>
          {/each}
        </div>
        <div class="flex justify-between text-light" on:click={e => e.stopPropagation()}>
          <div class="flex gap-6">
            <div>
              <button class="fa fa-reply cursor-pointer" on:click={startReply} />
              {$repliesCount}
            </div>
            <div class={cx({'text-accent': like})}>
              <button class="fa fa-heart cursor-pointer" on:click={() => like ? deleteReaction(like) : react("+")} />
              {$likesCount}
            </div>
            <div>
              <button class="fa fa-flag cursor-pointer" on:click={() => react("-")} />
              {$flagsCount}
            </div>
          </div>
          <div
            class="cursor-pointer flex gap-1 items-center" on:click={showActiveRelays}>
            <i class="fa fa-server" />
            <div
              class="h-1 w-1 rounded-full"
              style={`background: ${stringToColor(note.seen_on)}`} />
          </div>
        </div>
        {/if}
      </div>
    </div>
  </Card>
</div>

{#if reply}
<div transition:slide class="note-reply relative z-10" bind:this={replyContainer}>
  <div class="bg-medium border-medium border border-solid">
    <Compose bind:this={reply} onSubmit={sendReply}>
      <button
        slot="addon"
        on:click={sendReply}
        class="flex flex-col py-8 p-4 justify-center gap-2 border-l border-solid border-dark
               hover:bg-accent transition-all cursor-pointer text-white">
        <i class="fa fa-paper-plane fa-xl" />
      </button>
    </Compose>
  </div>
  {#if replyMentions.length > 0}
  <div class="text-white text-sm p-2 rounded-b border-t-0 border border-solid border-medium bg-black">
    <div class="inline-block border-r border-solid border-medium pl-1 pr-3 mr-2">
      <i class="fa fa-at" />
    </div>
    {#each replyMentions as p}
      <div class="inline-block py-1 px-2 mr-1 mb-2 rounded-full border border-solid border-light">
        <button class="fa fa-times cursor-pointer" on:click|stopPropagation={() => removeMention(p)} />
        {displayPerson(database.getPersonWithFallback(p))}
      </div>
    {/each}
    <div class="-mt-2" />
  </div>
  {/if}
</div>
{/if}

{#if note.children.length > 0}
<div class="ml-8 note-children" bind:this={childrenContainer}>
  {#if !showEntire && note.children.length > 3}
  <button class="ml-5 py-2 text-light cursor-pointer" on:click={onClick}>
    <i class="fa fa-up-down text-sm pr-2" />
    Show {quantify(note.children.length - 3, 'other reply', 'more replies')}
  </button>
  {/if}
  {#each note.children.slice(showEntire ? 0 : -3) as r (r.id)}
  <svelte:self showParent={false} note={r} {invertColors} {anchorId} {shouldDisplay} />
  {/each}
</div>
{/if}

{/if}
