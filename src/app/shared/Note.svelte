<script lang="ts">
  import {onMount, getContext} from "svelte"
  import {nth, nthEq} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getIdOrAddress,
    getReplyFilters,
    NOTE,
    COMMENT,
    REACTION,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {thunks, Router, pubkey, addMaximalFallbacks} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NoteHeader from "src/app/shared/NoteHeader.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import {timestamp1} from "src/util/misc"
  import {headerlessKinds} from "src/util/nostr"
  import NotePending from "src/app/shared/NotePending.svelte"
  import {getSetting, env, isEventMuted, loadPubkeys, myLoad} from "src/engine"
  import {router} from "src/app/util"

  export let event: TrustedEvent
  export let depth = 0
  export let pinned = false
  export let interactive = true
  export let showParent = true
  export let showEntire = false
  export let showMedia = getSetting("show_media")
  export let replyIsOpen = false
  export let addPendingReply = (thunk: Thunk) => undefined
  export let removePendingReply = (thunk: Thunk) => undefined

  let showHidden = false

  const topLevel = getContext("topLevel")

  const onClick = e => {
    const target = (e.detail?.target || e.target) as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      router
        .at("notes")
        .of(getIdOrAddress(event), {relays: Router.get().Event(event).getUrls()})
        .open()
    }
  }

  const onReplyStart = () => {
    replyIsOpen = true
  }

  const onReplyCancel = () => {
    replyIsOpen = false
  }

  const onReplyPublish = (thunk: Thunk) => {
    addPendingReply(thunk)
    replyIsOpen = false
  }

  const onReplyAbort = (thunk: Thunk) => {
    removePendingReply(thunk)
    replyIsOpen = true
  }

  $: thunk = $thunks[event.id]
  $: hidden = $isEventMuted(event, true)

  onMount(() => {
    loadPubkeys(event.tags.filter(nthEq(0, "zap")).map(nth(1)))

    const actions = getSetting("note_actions")
    const kinds = []

    if (actions.includes("replies")) {
      kinds.push(NOTE)
      kinds.push(COMMENT)
    }

    if (actions.includes("reactions")) {
      kinds.push(REACTION)
    }

    if (env.ENABLE_ZAPS && actions.includes("zaps")) {
      kinds.push(ZAP_RESPONSE)
    }

    myLoad({
      relays: Router.get().Replies(event).policy(addMaximalFallbacks).getUrls(),
      filters: getReplyFilters([event], {kinds}),
    })
  })
</script>

<div class="group relative">
  <Card stopPropagation class="relative" on:click={onClick} {interactive}>
    {#if pinned}
      <i class="fa fa-thumbtack absolute -right-1 -top-1 rotate-45 text-accent" />
    {/if}
    {#if !headerlessKinds.includes(event.kind)}
      <NoteHeader {event} {showParent} />
    {/if}
    {#if hidden && !showHidden}
      <p class="ml-14 mt-4 border-l-2 border-solid border-neutral-600 pl-4 text-neutral-100">
        You have hidden this note.
        <Anchor
          underline
          on:click={() => {
            showHidden = true
          }}>Show</Anchor>
      </p>
    {:else}
      <div class:!pl-0={headerlessKinds.includes(event.kind)} class="mt-2 sm:pl-14">
        <NoteContent note={event} {depth} {showEntire} {showMedia} />
      </div>
      <div class:!pl-10={headerlessKinds.includes(event.kind)} class="pt-4 sm:pl-14">
        {#if event.created_at > $timestamp1 - 45 && event.pubkey === $pubkey && !topLevel && thunk}
          <NotePending {event} {onReplyAbort} />
        {:else}
          <NoteActions {event} {onReplyStart} />
        {/if}
      </div>
    {/if}
  </Card>
  <NoteReply parent={event} {replyIsOpen} {onReplyCancel} {onReplyPublish} />
</div>
