<script lang="ts">
  import {nip19} from "nostr-tools"
  import {find, last} from "ramda"
  import {onMount} from "svelte"
  import {quantify} from "hurdak/lib/hurdak"
  import {findRootId, findReplyId, displayPerson} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import Card from "src/partials/Card.svelte"
  import user from "src/agent/user"
  import {getRelaysForEventParent} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import {watch} from "src/agent/db"
  import NoteContent from "src/app/shared/NoteContent.svelte"

  export let note
  export let feedRelay
  export let setFeedRelay = null
  export let depth = 0
  export let anchorId = null
  export let showParent = true
  export let showContext = false
  export let invertColors = false

  let reply = null
  let replyIsActive = false
  let actions = null
  let visibleNotes = []
  let collapsed = false

  const {mutes} = user
  const timestamp = formatTimestamp(note.created_at)
  const borderColor = invertColors ? "gray-6" : "gray-7"
  const showEntire = anchorId === note.id
  const interactive = !anchorId || !showEntire
  const author = watch("people", () => getPersonWithFallback(note.pubkey))

  let border, childrenContainer, noteContainer

  $: muted = find(m => m[1] === note.id, $mutes)

  $: visibleNotes = note.replies.filter(r => {
    if (feedRelay && !r.seen_on.includes(feedRelay.url)) {
      return false
    }

    return showContext ? true : !r.isContext
  })

  const goToNote = data => modal.push({type: "note/detail", ...data})

  const onClick = e => {
    const target = e.target as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      goToNote({note})
    }
  }

  const goToParent = async () => {
    const relays = getRelaysForEventParent(note)

    goToNote({note: {id: findReplyId(note)}, relays})
  }

  const goToRoot = async () => {
    const relays = getRelaysForEventParent(note)

    goToNote({note: {id: findRootId(note)}, relays})
  }

  const setBorderHeight = () => {
    const getHeight = e => e?.getBoundingClientRect().height || 0

    if (childrenContainer && noteContainer) {
      const lastChild = last(
        [].slice.apply(childrenContainer.children).filter(e => e.matches(".note"))
      )

      if (lastChild) {
        const height =
          66 +
          getHeight(childrenContainer) -
          getHeight(lastChild) -
          getHeight(lastChild.nextElementSibling) -
          getHeight(lastChild.nextElementSibling?.nextElementSibling) -
          (lastChild.nextElementSibling ? 16 : 0)

        border.style = `height: ${height - 21}px`
      }
    }
  }

  onMount(() => {
    const interval = setInterval(setBorderHeight, 400)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<div class="note">
  <div bind:this={noteContainer} class="group relative">
    <Card class="relative flex gap-4" on:click={onClick} {interactive} {invertColors}>
      {#if !showParent}
        <div
          class={`absolute -ml-4 h-px w-4 bg-${borderColor} z-10`}
          style="left: 0px; top: 27px;" />
      {/if}
      <div>
        <Anchor
          class="text-lg font-bold"
          on:click={() => modal.push({type: "person/feed", pubkey: $author.pubkey})}>
          <PersonCircle size={10} person={$author} />
        </Anchor>
      </div>
      <div class="flex min-w-0 flex-grow flex-col gap-2">
        <div class="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <Popover triggerType="mouseenter">
            <div slot="trigger">
              <Anchor
                type="unstyled"
                class="flex items-center gap-2 pr-16 text-lg font-bold"
                on:click={() => modal.push({type: "person/feed", pubkey: $author.pubkey})}>
                <span>{displayPerson($author)}</span>
                {#if $author.verified_as}
                  <i class="fa fa-circle-check text-sm text-accent" />
                {/if}
              </Anchor>
            </div>
            <div slot="tooltip">
              <PersonSummary pubkey={$author.pubkey} />
            </div>
          </Popover>
          <Anchor
            href={"/" + nip19.neventEncode({id: note.id, relays: note.seen_on})}
            class="text-sm text-gray-1"
            type="unstyled">
            {timestamp}
          </Anchor>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            {#if findReplyId(note) && showParent}
              <small class="text-gray-1">
                <i class="fa fa-code-merge" />
                <Anchor on:click={goToParent}>View Parent</Anchor>
              </small>
            {/if}
            {#if findRootId(note) && findRootId(note) !== findReplyId(note) && showParent}
              <small class="text-gray-1">
                <i class="fa fa-code-pull-request" />
                <Anchor on:click={goToRoot}>View Thread</Anchor>
              </small>
            {/if}
          </div>
          {#if muted}
            <p class="border-l-2 border-solid border-gray-6 pl-4 text-gray-1">
              You have muted this note.
            </p>
          {:else}
            <NoteContent {anchorId} {note} {showEntire} />
          {/if}
          <NoteActions
            bind:this={actions}
            {note}
            {reply}
            {author}
            {muted}
            {setFeedRelay}
            {showEntire} />
        </div>
      </div>
    </Card>
  </div>

  {#if !replyIsActive && visibleNotes.length > 0 && !showEntire && depth > 0 && !muted}
    <div class="relative">
      <div
        class="absolute top-0 right-0 z-10 -mt-4 -mr-2 flex h-6 w-6 cursor-pointer items-center
                 justify-center rounded-full border border-solid border-gray-7 bg-gray-8 text-gray-2"
        on:click={() => {
          collapsed = !collapsed
        }}>
        <Popover triggerType="mouseenter">
          <div slot="trigger">
            {#if collapsed}
              <i class="fa fa-xs fa-up-right-and-down-left-from-center" />
            {:else}
              <i class="fa fa-xs fa-down-left-and-up-right-to-center" />
            {/if}
          </div>
          <div slot="tooltip">
            {collapsed ? "Show replies" : "Hide replies"}
          </div>
        </Popover>
      </div>
    </div>
  {/if}

  <NoteReply
    bind:this={reply}
    on:start={() => {
      replyIsActive = true
    }}
    on:reset={() => {
      replyIsActive = false
    }}
    {note}
    {borderColor} />

  {#if !collapsed && visibleNotes.length > 0 && depth > 0 && !muted}
    <div class="relative mt-4">
      <div class={`absolute w-px bg-${borderColor} z-10 -mt-4 ml-4 h-0`} bind:this={border} />
      <div class="note-children relative ml-8 flex flex-col gap-4" bind:this={childrenContainer}>
        {#if !showEntire && note.replies.length > visibleNotes.length}
          <button class="ml-5 cursor-pointer py-2 text-gray-1 outline-0" on:click={onClick}>
            <i class="fa fa-up-down pr-2 text-sm" />
            Show {quantify(
              note.replies.length - visibleNotes.length,
              "other reply",
              "more replies"
            )}
          </button>
        {/if}
        {#each visibleNotes as r (r.id)}
          <svelte:self
            showParent={false}
            note={r}
            depth={depth - 1}
            {feedRelay}
            {setFeedRelay}
            {invertColors}
            {anchorId}
            {showContext} />
        {/each}
      </div>
    </div>
  {/if}
</div>
