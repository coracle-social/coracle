<script lang="ts">
  import {last, sortBy, uniqBy, prop} from "ramda"
  import {onMount, onDestroy} from "svelte"
  import {quantify} from "hurdak"
  import {findRootId, findReplyId, isLike} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import Popover from "src/partials/Popover.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/router"
  import type {Event} from "src/engine"
  import {
    env,
    load,
    loadOne,
    processZaps,
    matchFilters,
    getReplyHints,
    isEventMuted,
    getParentHints,
    getEventHints,
    getIdFilters,
    selectHints,
    mergeHints,
    loadPubkeys,
  } from "src/engine"

  export let note
  export let relays = []
  export let context = []
  export let filters = null
  export let feedRelay = null
  export let setFeedRelay = null
  export let depth = 0
  export let anchorId = null
  export let topLevel = false
  export let showParent = true
  export let invertColors = false
  export let showLoading = false

  let event = note
  let reply = null
  let replyIsActive = false
  let showMuted = false
  let actions = null
  let collapsed = false
  let ctx = context

  const {ENABLE_ZAPS} = $env
  const borderColor = invertColors ? "gray-6" : "gray-7"
  const showEntire = anchorId === event.id
  const interactive = !anchorId || !showEntire

  let interval, border, childrenContainer, noteContainer

  const onClick = e => {
    const target = e.target as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(event.id)
        .qp({relays: getEventHints(event)})
        .cx({context: ctx.concat(event)})
        .open()
    }
  }

  const showPerson = () => router.at("people").of(event.pubkey).open()

  const goToParent = () =>
    router
      .at("notes")
      .of(findReplyId(event))
      .qp({relays: getParentHints(event)})
      .cx({context: ctx.concat(event)})
      .open()

  const goToThread = () =>
    router
      .at("notes")
      .of(event.id)
      .at("thread")
      .qp({relays: getEventHints(event)})
      .cx({context: ctx.concat(event)})
      .open()

  const setBorderHeight = () => {
    const getHeight = e => e?.getBoundingClientRect().height || 0

    if (childrenContainer && noteContainer) {
      const lastChild = last(
        [].slice.apply(childrenContainer.children).filter(e => e.matches(".note"))
      ) as any

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

  $: muted = !showMuted && $isEventMuted(event)

  $: children = ctx.filter(e => findReplyId(e) === event.id)

  $: replies = sortBy(
    (e: Event) => -e.created_at,
    children.filter(e => e.kind === 1)
  )

  $: likes = children.filter(e => e.kind === 7 && isLike(e.content))

  $: zaps = processZaps(
    children.filter(e => e.kind === 9735),
    event.pubkey
  )

  // Show only notes that match our filters and feed relay
  $: visibleNotes = replies.filter(
    e => (!filters || matchFilters(filters, e)) && (!feedRelay || e.seen_on.includes(feedRelay.url))
  )

  onMount(async () => {
    interval = setInterval(setBorderHeight, 400)

    if (!event.pubkey) {
      event = await loadOne({
        relays: selectHints(relays),
        filters: getIdFilters([event.id]),
      })
    }

    if (event.pubkey) {
      loadPubkeys([event.pubkey])

      const kinds = [1, 7]

      if (ENABLE_ZAPS) {
        kinds.push(9735)
      }

      load({
        relays: mergeHints([relays, getReplyHints(event)]),
        filters: [{kinds, "#e": [event.id]}],
        onEvent: e => {
          if (!$isEventMuted(e)) {
            ctx = uniqBy(prop("id"), ctx.concat(e))
          }
        },
      })
    }
  })

  onDestroy(() => {
    clearInterval(interval)
  })
</script>

{#if event.pubkey}
  <div class="note">
    <div bind:this={noteContainer} class="group relative">
      <Card class="relative flex gap-4" on:click={onClick} {interactive} {invertColors}>
        {#if !showParent && !topLevel}
          <div
            class={`absolute -ml-4 h-px w-4 bg-${borderColor} z-10`}
            style="left: 0px; top: 27px;" />
        {/if}
        <div>
          <Anchor class="text-lg font-bold" on:click={showPerson}>
            <PersonCircle class="h-10 w-10" pubkey={event.pubkey} />
          </Anchor>
        </div>
        <div class="flex min-w-0 flex-grow flex-col gap-2">
          <div class="flex flex-col items-start justify-between sm:flex-row">
            <Anchor type="unstyled" class="pr-16 text-lg font-bold" on:click={showPerson}>
              <PersonName pubkey={event.pubkey} />
            </Anchor>
            <Anchor
              href={router
                .at("notes")
                .of(event.id)
                .qp({relays: getEventHints(event)}).path}
              class="text-end text-sm text-gray-1"
              type="unstyled">
              {formatTimestamp(event.created_at)}
            </Anchor>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              {#if findReplyId(event) && showParent}
                <small class="text-gray-1">
                  <i class="fa fa-code-merge" />
                  <Anchor class="underline" on:click={goToParent}>View Parent</Anchor>
                </small>
              {/if}
              {#if findRootId(event) && findRootId(event) !== findReplyId(event) && showParent}
                <small class="text-gray-1">
                  <i class="fa fa-code-pull-request" />
                  <Anchor class="underline" on:click={goToThread}>View Thread</Anchor>
                </small>
              {/if}
            </div>
            {#if muted}
              <p class="border-l-2 border-solid border-gray-6 pl-4 text-gray-1">
                You have muted this note.
                <Anchor
                  theme="anchor"
                  on:click={() => {
                    showMuted = true
                  }}>Show</Anchor>
              </p>
            {:else}
              <NoteContent {anchorId} note={event} {showEntire} />
            {/if}
            <NoteActions
              note={event}
              bind:this={actions}
              bind:replies
              bind:likes
              bind:zaps
              {muted}
              {reply}
              {setFeedRelay}
              {showEntire} />
          </div>
        </div>
      </Card>
    </div>

    {#if !replyIsActive && visibleNotes.length > 0 && !showEntire && depth > 0 && !muted}
      <div class="relative">
        <div
          class="absolute right-0 top-0 z-10 -mr-2 -mt-4 flex h-6 w-6 cursor-pointer items-center
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
      parent={event}
      bind:this={reply}
      on:start={() => {
        replyIsActive = true
      }}
      on:reset={() => {
        replyIsActive = false
      }}
      on:event={e => {
        ctx = [e.detail, ...ctx]
      }}
      {borderColor} />

    {#if !collapsed && visibleNotes.length > 0 && depth > 0 && !muted}
      <div class="relative mt-4">
        <div class={`absolute w-px bg-${borderColor} z-10 -mt-4 ml-4 h-0`} bind:this={border} />
        <div class="note-children relative ml-8 flex flex-col gap-4" bind:this={childrenContainer}>
          {#if !showEntire && replies.length > visibleNotes.length}
            <button class="ml-5 cursor-pointer py-2 text-gray-1 outline-0" on:click={onClick}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(replies.length - visibleNotes.length, "other reply", "more replies")}
            </button>
          {/if}
          {#each visibleNotes as r (r.id)}
            <svelte:self
              showParent={false}
              note={r}
              depth={depth - 1}
              context={ctx}
              {feedRelay}
              {setFeedRelay}
              {invertColors}
              {anchorId} />
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else if showLoading}
  <Spinner />
{/if}
