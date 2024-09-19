<script lang="ts">
  import {ctx, nthEq} from "@welshman/lib"
  import {
    isChildOf,
    getReplyFilters,
    getIdOrAddress,
    Tags,
    getLnUrl,
    matchFilters,
    zapFromEvent,
    NOTE,
    REACTION,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {repository, deriveZapperForPubkey, deriveZapper} from "@welshman/app"
  import {identity, reject, whereEq, uniqBy, prop} from "ramda"
  import {onMount} from "svelte"
  import {quantify, batch} from "hurdak"
  import {fly, slide} from "src/util/transition"
  import {replyKinds, isLike} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import Popover from "src/partials/Popover.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import NoteMeta from "src/app/shared/NoteMeta.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/util/router"
  import {
    env,
    load,
    loadEvent,
    ensureUnwrapped,
    isEventMuted,
    userMutes,
    getSetting,
    sortEventsDesc,
  } from "src/engine"

  export let note
  export let relays = []
  export let filters = null
  export let depth = 0
  export let anchor = null
  export let topLevel = false
  export let isLastReply = false
  export let showParent = true
  export let showLoading = false
  export let showHidden = false
  export let showGroup = false
  export let showMedia = getSetting("show_media")
  export let contextAddress = null

  let ready = false
  let event = note
  let replyCtrl = null
  let replyIsActive = false
  let showMutedReplies = false
  let actions = null
  let collapsed = depth === 0
  let context = repository.query([{"#e": [event.id]}]).filter(e => isChildOf(e, event))
  let showHiddenReplies = anchor === getIdOrAddress(event)

  const showEntire = showHiddenReplies
  const interactive = !anchor || !showEntire

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(getIdOrAddress(event), {relays: ctx.app.router.Event(event).getUrls()})
        .open()
    }
  }

  const showPerson = () => router.at("people").of(event.pubkey).open()

  const goToDetail = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: ctx.app.router.Event(event).getUrls()})
      .push()

  const goToParent = () =>
    router
      .at("notes")
      .of(reply.value(), {relays: ctx.app.router.EventParents(event).getUrls()})
      .open()

  const goToThread = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: ctx.app.router.EventRoots(event).getUrls()})
      .at("thread")
      .open()

  const removeFromContext = e => {
    context = reject(whereEq({id: e.id}), context)
  }

  const addToContext = events => {
    context = context.concat(events)
  }

  $: tags = Tags.fromEvent(event)
  $: reply = tags.parent()
  $: root = tags.root()
  $: lnurl = getLnUrl(event.tags?.find(nthEq(0, "zap"))?.[1] || "")
  $: zapper = lnurl ? deriveZapper(lnurl) : deriveZapperForPubkey(event.pubkey)
  $: muted = $userMutes.has(event.id)
  $: hidden = $isEventMuted(event, true)

  // Find children in our context
  $: children = context.filter(e => isChildOf(e, event))

  // Sort our replies
  $: replies = sortEventsDesc(children.filter(e => replyKinds.includes(e.kind)))

  let mutedReplies, hiddenReplies, visibleReplies

  $: {
    mutedReplies = []
    hiddenReplies = []
    visibleReplies = []

    for (const e of replies) {
      if ($isEventMuted(e, true)) {
        mutedReplies.push(e)
      } else if (collapsed) {
        hiddenReplies.push(e)
      } else if (!showHiddenReplies && filters && !matchFilters(filters, e)) {
        hiddenReplies.push(e)
      } else {
        visibleReplies.push(e)
      }
    }

    if (depth === 0) {
      mutedReplies.splice(0)
      hiddenReplies.splice(0)
    }

    if (!showHiddenReplies && visibleReplies.length === 0) {
      mutedReplies.splice(0)
      hiddenReplies.splice(0)
    }

    if (showMutedReplies) {
      visibleReplies = visibleReplies.concat(mutedReplies.splice(0))
    }

    if (!showHiddenReplies) {
      hiddenReplies = hiddenReplies.concat(visibleReplies.slice(3))
      visibleReplies = visibleReplies.slice(0, 3)
    }
  }

  // Split out likes, uniqify by pubkey since a like can be duplicated across groups
  $: likes = uniqBy(prop("pubkey"), children.filter(isLike))

  // Split out zaps
  $: zaps = children
    .filter(e => e.kind === 9735)
    .map(e => ($zapper ? zapFromEvent(e, $zapper) : null))
    .filter(identity)

  onMount(async () => {
    if (!event.pubkey) {
      event = await loadEvent(event.id, {
        relays: ctx.app.router.fromRelays(relays).getUrls(),
      })
    }

    event = await ensureUnwrapped(event)

    if (event.pubkey) {
      ready = true

      const actions = getSetting("note_actions")
      const kinds = []

      if (actions.includes("replies")) {
        kinds.push(NOTE)
      }

      if (actions.includes("reactions")) {
        kinds.push(REACTION)
      }

      if (env.ENABLE_ZAPS && actions.includes("zaps")) {
        kinds.push(ZAP_RESPONSE)
      }

      load({
        relays: ctx.app.router.EventChildren(event).getUrls(),
        filters: getReplyFilters([event], {kinds}),
        onEvent: batch(200, events => {
          context = uniqBy(prop("id"), context.concat(events))
        }),
      })
    }
  })
</script>

{#if ready}
  {@const showReply = reply && !tags.parents().values().has(anchor) && showParent}
  {@const showRoot =
    root && !tags.roots().values().has(anchor) && root.value() !== reply?.value() && showParent}
  <div>
    <NoteMeta note={event} {showGroup} />
    <div class="note relative">
      {#if !showParent && !topLevel}
        <AltColor let:isAlt>
          <svg height="36" width="36" class="absolute -left-[18px] top-1">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke-width="4"
              stroke-dashoffset="54"
              stroke-dasharray="100 100"
              transform-origin="center"
              class={isAlt ? "stroke-tinted-700" : "stroke-neutral-800"} />
          </svg>
        </AltColor>
        {#if isLastReply}
          <AltColor background class="absolute -left-4 h-[20px] w-1" let:isAlt />
        {:else}
          <AltColor background class="absolute -bottom-2 -left-4 top-0 w-1" let:isAlt />
        {/if}
      {/if}
      <div class="group relative" class:pt-4={!showParent && !topLevel}>
        <Card stopPropagation class="relative flex gap-4" on:click={onClick} {interactive}>
          <div>
            <Anchor class="text-lg font-bold" on:click={showPerson}>
              <PersonCircle class="h-10 w-10" pubkey={event.pubkey} />
            </Anchor>
          </div>
          <div class="flex min-w-0 flex-grow flex-col gap-2">
            <div class="flex min-w-0 flex-col items-start justify-between sm:flex-row">
              <Anchor type="unstyled" class="mr-4 min-w-0" on:click={showPerson}>
                <PersonName pubkey={event.pubkey} />
              </Anchor>
              <div class="flex items-center gap-3">
                <Anchor
                  on:click={goToDetail}
                  class="whitespace-nowrap text-end text-sm text-neutral-100"
                  type="unstyled">
                  {formatTimestamp(event.created_at)}
                </Anchor>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                {#if showReply}
                  <small class="text-neutral-100">
                    <i class="fa fa-code-merge" />
                    <Anchor underline on:click={goToParent}>View Parent</Anchor>
                  </small>
                {/if}
                {#if showRoot}
                  <small class="text-neutral-100">
                    <i class="fa fa-code-pull-request" />
                    <Anchor underline on:click={goToThread}>View Thread</Anchor>
                  </small>
                {/if}
              </div>
              {#if hidden && !showHidden}
                <p class="border-l-2 border-solid border-neutral-600 pl-4 text-neutral-100">
                  You have hidden this note.
                  <Anchor
                    underline
                    on:click={() => {
                      showHidden = true
                    }}>Show</Anchor>
                </p>
              {:else}
                <NoteContent note={event} {showEntire} {showMedia} />
              {/if}
              <div class="cy-note-click-target h-[2px]" />
              <NoteActions
                note={event}
                zapper={$zapper}
                bind:this={actions}
                {removeFromContext}
                {contextAddress}
                {addToContext}
                {replyCtrl}
                {showHidden}
                {replies}
                {likes}
                {zaps}
                {muted} />
            </div>
          </div>
        </Card>
      </div>

      {#if !replyIsActive && (visibleReplies.length > 0 || collapsed) && !showEntire && depth > 0}
        <div class="relative">
          <AltColor
            background
            class="absolute left-0 top-0 -mr-2 -mt-6 flex h-8 w-8 cursor-pointer items-center
                   justify-center rounded-full"
            on:click={() => {
              collapsed = !collapsed
            }}>
            <Popover triggerType="mouseenter">
              <div slot="trigger">
                <i
                  class="fa fa-arrow-up transition-all"
                  class:text-tinted-500={!collapsed}
                  class:text-tinted-100={collapsed}
                  class:rotate-180={collapsed} />
              </div>
              <div slot="tooltip">
                {collapsed ? "Show replies" : "Hide replies"}
              </div>
            </Popover>
          </AltColor>
        </div>
      {/if}

      <NoteReply
        {addToContext}
        {contextAddress}
        parent={event}
        showBorder={visibleReplies.length > 0}
        bind:this={replyCtrl}
        on:start={() => {
          replyIsActive = true
        }}
        on:reset={() => {
          replyIsActive = false
        }}
        on:event={e => {
          context = [e.detail, ...context]
        }} />

      {#if visibleReplies.length > 0 || hiddenReplies.length > 0 || mutedReplies.length > 0}
        <div
          class="note-children relative ml-4 mt-1 flex flex-col"
          in:fly|local={{y: 20}}
          out:slide|local>
          {#if hiddenReplies.length > 0}
            <button
              class="mt-4 cursor-pointer rounded-md bg-gradient-to-l from-transparent via-tinted-700 to-tinted-700 py-2 text-neutral-100 outline-0 transition-colors hover:bg-tinted-700"
              on:click={() => {
                showHiddenReplies = true
              }}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(hiddenReplies.length, "other reply", "more replies")}
            </button>
            {#if visibleReplies.length > 0}
              <AltColor background class="absolute -left-4 -top-10 h-28 w-1" />
            {/if}
          {:else if visibleReplies.length > 0}
            <AltColor background class="absolute -left-4 -top-10 h-14 w-1" />
          {/if}
          {#if visibleReplies.length}
            {#key showHiddenReplies}
              <div in:fly={{y: 20}}>
                {#each visibleReplies as r, i (r.id)}
                  <svelte:self
                    isLastReply={i === visibleReplies.length - 1}
                    showParent={false}
                    showHidden
                    note={r}
                    depth={depth - 1}
                    {filters}
                    {anchor} />
                {/each}
              </div>
            {/key}
          {/if}
          {#if showHiddenReplies && mutedReplies.length > 0}
            <button
              class="mt-4 cursor-pointer rounded-md bg-gradient-to-l from-transparent via-tinted-700 to-tinted-700 py-2 text-neutral-100 outline-0 transition-colors hover:bg-tinted-700"
              on:click={() => {
                showMutedReplies = true
              }}>
              <i class="fa fa-up-down pr-2 text-sm" />
              Show {quantify(mutedReplies.length, "hidden reply", "hidden replies")}
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else if showLoading}
  <Spinner />
{/if}
