<script lang="ts">
  import cx from 'classnames'
  import {nip19} from 'nostr-tools'
  import {find, last, whereEq, without, uniq, pluck, reject, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {tweened} from 'svelte/motion'
  import {slide} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {quantify} from 'hurdak/lib/hurdak'
  import {Tags, findRootId, findReplyId, displayPerson, isLike} from "src/util/nostr"
  import {extractUrls} from "src/util/html"
  import ImageCircle from 'src/partials/ImageCircle.svelte'
  import Content from 'src/partials/Content.svelte'
  import PersonSummary from 'src/views/person/PersonSummary.svelte'
  import Popover from 'src/partials/Popover.svelte'
  import RelayCard from 'src/views/relays/RelayCard.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import Preview from 'src/partials/Preview.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {toast, modal} from "src/app/ui"
  import {renderNote} from "src/app"
  import {formatTimestamp, stringToColor} from 'src/util/misc'
  import Compose from "src/partials/Compose.svelte"
  import Card from "src/partials/Card.svelte"
  import user from 'src/agent/user'
  import {getEventPublishRelays, getRelaysForEventParent} from 'src/agent/relays'
  import database from 'src/agent/database'
  import cmd from 'src/agent/cmd'
  import {routes} from 'src/app/ui'
  import {publishWithToast} from 'src/app'

  export let note
  export let depth = 0
  export let anchorId = null
  export let showParent = true
  export let showContext = false
  export let invertColors = false

  const getDefaultReplyMentions = () =>
    without([user.getPubkey()], uniq(Tags.from(note).type("p").values().all().concat(note.pubkey)))

  let reply = null
  let replyMentions = getDefaultReplyMentions()
  let replyContainer = null
  let visibleNotes = []
  let showRelays = false

  const {profile} = user
  const links = extractUrls(note.content)
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

  $: like = find(whereEq({pubkey: $profile?.pubkey}), likes)
  $: flag = find(whereEq({pubkey: $profile?.pubkey}), flags)

  $: $likesCount = likes.length
  $: $flagsCount = flags.length
  $: $repliesCount = note.replies.length
  $: visibleNotes = note.replies.filter(r => showContext ? true : !r.isContext)

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

  const react = async content => {
    if (!$profile) {
      return navigate('/login')
    }

    const relays = getEventPublishRelays(note)
    const [event] = await cmd.createReaction(note, content).publish(relays)

    if (content === '+') {
      likes = likes.concat(event)
    }

    if (content === '-') {
      flags = flags.concat(event)
    }
  }

  const deleteReaction = e => {
    cmd.deleteEvent([e.id]).publish(getEventPublishRelays(note))

    if (e.content === '+') {
      likes = reject(propEq('pubkey', $profile.pubkey), likes)
    }

    if (e.content === '-') {
      flags = reject(propEq('pubkey', $profile.pubkey), flags)
    }
  }

  const startReply = () => {
    if ($profile) {
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

  const onReplyKeydown = e => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      resetReply()
    }
  }

  const sendReply = async () => {
    let {content, mentions, topics} = reply.parse()

    if (content) {
      mentions = uniq(mentions.concat(replyMentions))

      const relays = getEventPublishRelays(note)
      const thunk = cmd.createReply(note, content, mentions, topics)
      const [event, promise] = await publishWithToast(relays, thunk)

      promise.then(({succeeded}) => {
        if (succeeded.size > 0) {
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
        }
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

      if (lastChild) {
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
  }

  onMount(() => {
    const interval = setInterval(setBorderHeight, 300)

    return () => clearInterval(interval)
  })
</script>

<svelte:body on:click={onBodyClick} />

{#if $person}
<div bind:this={noteContainer} class="note relative">
  <div class="absolute w-px bg-light z-10 ml-8 mt-12 h-0" bind:this={border} />
  <Card class="flex gap-4 relative" on:click={onClick} {interactive} {invertColors}>
    {#if !showParent}
    <div class="absolute h-px w-3 bg-light z-10" style="left: 0px; top: 27px;" />
    {/if}
    <div>
      <Anchor class="text-lg font-bold" href={routes.person($person.pubkey)}>
        <ImageCircle size={10} src={$person.kind0?.picture} />
      </Anchor>
    </div>
    <div class="flex flex-col gap-2 flex-grow min-w-0">
      <div class="flex items-center justify-between">
        <Popover>
          <div slot="trigger">
            <Anchor type="unstyled" class="text-lg font-bold flex gap-2 items-center">
              <span>{displayPerson($person)}</span>
              {#if $person.verified_as}
              <i class="fa fa-circle-check text-accent text-sm" />
              {/if}
            </Anchor>
          </div>
          <div slot="tooltip">
            <PersonSummary pubkey={$person.pubkey} />
          </div>
        </Popover>
        <Anchor
          href={"/" + nip19.neventEncode({id: note.id, relays: [note.seen_on]})}
          class="text-sm text-light"
          type="unstyled">
          {formatTimestamp(note.created_at)}
        </Anchor>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          {#if findReplyId(note) && showParent}
            <small class="text-light">
              <i class="fa fa-code-merge" />
              <Anchor on:click={goToParent}>View Parent</Anchor>
            </small>
          {/if}
          {#if findRootId(note) && findRootId(note) !== findReplyId(note) && showParent}
            <small class="text-light">
              <i class="fa fa-code-pull-request" />
              <Anchor on:click={goToRoot}>View Thread</Anchor>
            </small>
          {/if}
        </div>
        {#if flag}
        <p class="text-light border-l-2 border-solid border-medium pl-4">
          You have flagged this content as offensive.
          <Anchor on:click={() => deleteReaction(flag)}>Unflag</Anchor>
        </p>
        {:else}
        <div class="text-ellipsis overflow-hidden flex flex-col gap-2">
          <p>{@html renderNote(note, {showEntire})}</p>
          {#if user.getSetting('showMedia') && links.length > 0}
          <button class="inline-block" on:click={e => e.stopPropagation()}>
            <Preview url={last(links)} />
          </button>
          {/if}
        </div>
        <div class="flex justify-between text-light" on:click={e => e.stopPropagation()}>
          <div class="flex">
            <div class="w-16">
              <button class="fa fa-reply cursor-pointer" on:click={startReply} />
              {$repliesCount}
            </div>
            <div class={cx('w-16', {'text-accent': like})}>
              <button
                class={cx('fa fa-heart cursor-pointer', {'fa-beat fa-beat-custom': like})}
                on:click={() => like ? deleteReaction(like) : react("+")} />
              {$likesCount}
            </div>
            <div class="w-16">
              <button class="fa fa-flag cursor-pointer" on:click={() => react("-")} />
              {$flagsCount}
            </div>
          </div>
          <div
            class="cursor-pointer flex gap-1 items-center" on:click={() => { showRelays = true }}>
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
  <div class="bg-medium border-light border border-solid" on:keydown={onReplyKeydown}>
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
  <div class="text-white text-sm p-2 rounded-b border-t-0 border border-solid border-light bg-black">
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

{#if visibleNotes.length > 0 && depth > 0}
<div class="ml-8 note-children" bind:this={childrenContainer}>
  {#if !showEntire && note.replies.length > visibleNotes.length}
  <button class="ml-5 py-2 text-light cursor-pointer" on:click={onClick}>
    <i class="fa fa-up-down text-sm pr-2" />
    Show {quantify(note.replies.length - visibleNotes.length, 'other reply', 'more replies')}
  </button>
  {/if}
  {#each visibleNotes as r (r.id)}
  <svelte:self showParent={false} note={r} depth={depth - 1} {invertColors} {anchorId} {showContext} />
  {/each}
</div>
{/if}

{#if showRelays}
<Modal onEscape={() => { showRelays = false }}>
  <Content>
    <RelayCard theme="black" showControls relay={{url: note.seen_on}} />
  </Content>
</Modal>
{/if}

{/if}
