<script lang="ts">
  import {last, partition, reject, propEq, uniqBy, prop} from "ramda"
  import {onMount, onDestroy} from "svelte"
  import {quantify, batch} from "hurdak"
  import {findRootId, isChildOf, findReplyId, isLike} from "src/util/nostr"
  import {fly} from "src/util/transition"
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
    getReplyFilters,
    selectHints,
    mergeHints,
    loadPubkeys,
    sortEventsDesc,
  } from "src/engine"

  export let note
  export let relays = []
  export let context = []
  export let filters = null
  export let depth = 0
  export let anchorId = null
  export let topLevel = false
  export let showParent = true
  export let showLoading = false
  export let showMuted = false

  let event = note
  let reply = null
  let replyIsActive = false
  let showMutedReplies = false
  let actions = null
  let collapsed = depth === 0
  let ctx = uniqBy(prop("id"), context)

  const {ENABLE_ZAPS} = $env
  const showEntire = anchorId === event.id
  const interactive = !anchorId || !showEntire

  let interval, border, childrenContainer, noteContainer

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(event.id)
        .cx({context: ctx.concat(event), relays: getEventHints(event)})
        .open()
    }
  }

  const showPerson = () => router.at("people").of(event.pubkey).open()

  const goToParent = () =>
    router
      .at("notes")
      .of(findReplyId(event))
      .cx({context: ctx.concat(event), relays: getParentHints(event)})
      .open()

  const goToThread = () =>
    router
      .at("notes")
      .of(event.id)
      .at("thread")
      .cx({context: ctx.concat(event), relays: getEventHints(event)})
      .open()

  const removeFromContext = e => {
    ctx = reject(propEq("id", e.id), ctx)
  }

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

  // Find children in our context
  $: children = ctx.filter(e => isChildOf(e, event))

  // Sort our replies
  $: replies = sortEventsDesc(children.filter(e => e.kind === 1))

  // Find notes that match our filter
  $: matchingReplies = collapsed ? [] : replies.filter(e => !filters || matchFilters(filters, e))

  // Split out muted notes
  $: [mutedReplies, unmutedReplies] = partition($isEventMuted, matchingReplies)

  // Only show unmuted, matching notes
  $: visibleReplies = unmutedReplies.filter(e => !filters || matchFilters(filters, e))

  // Notify the user if there are muted notes if they would otherwise see them
  $: hiddenReplies = mutedReplies.filter(e => !filters || matchFilters(filters, e))

  // Split out likes
  $: likes = children.filter(e => e.kind === 7 && isLike(e.content))

  // Split out zaps
  $: zaps = processZaps(
    children.filter(e => e.kind === 9735),
    event.pubkey
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
        filters: getReplyFilters([event], {kinds}),
        onEvent: batch(200, events => {
          ctx = uniqBy(prop("id"), ctx.concat(events))
        }),
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
      <Card stopPropagation class="relative flex gap-4" on:click={onClick} {interactive}>
        {#if !showParent && !topLevel}
          <div
            class="absolute z-10 -ml-4 h-px w-4 bg-gray-7 group-[.modal]:bg-gray-6"
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
                .cx({relays: getEventHints(event)})
                .toString()}
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
              {removeFromContext}
              {replies}
              {likes}
              {zaps}
              {reply}
              {showEntire} />
          </div>
        </div>
      </Card>
    </div>

    {#if !replyIsActive && unmutedReplies.length > 0 && !showEntire && depth > 0}
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
      }} />

    {#if visibleReplies.length > 0 || hiddenReplies.length > 0}
      <div class="relative mt-4">
        <div
          class="absolute z-10 -mt-4 ml-4 h-0 w-px bg-gray-7 group-[.modal]:bg-gray-6"
          bind:this={border} />
        <div class="note-children relative ml-8 flex flex-col gap-4" bind:this={childrenContainer}>
          {#if !showEntire && unmutedReplies.length > visibleReplies.length}
            <button class="ml-5 cursor-pointer py-2 text-gray-1 outline-0" on:click={onClick}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(
                unmutedReplies.length - visibleReplies.length,
                "other reply",
                "more replies"
              )}
            </button>
          {/if}
          {#each visibleReplies as r (r.id)}
            <svelte:self
              showParent={false}
              showMuted
              note={r}
              depth={depth - 1}
              context={ctx}
              {anchorId} />
          {/each}
          {#if showEntire && showMutedReplies}
            {#each hiddenReplies as r (r.id)}
              <svelte:self
                showParent={false}
                showMuted
                note={r}
                depth={depth - 1}
                context={ctx}
                {anchorId} />
            {/each}
          {:else if showEntire && hiddenReplies.length > 0}
            <button
              class="ml-5 cursor-pointer py-2 text-gray-1 outline-0"
              in:fly={{y: 20}}
              on:click={() => {
                showMutedReplies = true
              }}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(hiddenReplies.length, "hidden reply", "hidden replies")}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{:else if showLoading}
  <Spinner />
{/if}
