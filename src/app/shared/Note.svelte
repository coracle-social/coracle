<script lang="ts">
  import {nip19} from "nostr-tools"
  import {last, sortBy, uniqBy, prop, identity} from "ramda"
  import {onMount, onDestroy} from "svelte"
  import {quantify, switcherFn} from "hurdak"
  import {findRootId, findReplyId, isLike} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import NoteReply from "src/app/shared/NoteReply.svelte"
  import NoteActions from "src/app/shared/NoteActions.svelte"
  import Card from "src/partials/Card.svelte"
  import type {Event} from "src/engine"
  import {
    env,
    load,
    mutes,
    processZap,
    deriveMuted,
    derivePerson,
    getReplyHints,
    isEventMuted,
    getParentHints,
    getEventHints,
    getIdFilters,
    getUserRelayUrls,
    mergeHints,
    loadPubkeys,
  } from "src/engine"
  import NoteContent from "src/app/shared/NoteContent.svelte"

  export let note
  export let relays = []
  export let context = null
  export let feedRelay = null
  export let setFeedRelay = null
  export let depth = 0
  export let anchorId = null
  export let topLevel = false
  export let showParent = true
  export let showContext = false
  export let invertColors = false

  let event = note
  let reply = null
  let replyIsActive = false
  let actions = null
  let collapsed = false
  let replies = sortBy(
    (e: Event) => -e.created_at,
    (context || []).filter(e => e.kind === 1 && findReplyId(e) === event.id)
  )
  let likes = []
  let zaps = []

  const {ENABLE_ZAPS} = $env
  const borderColor = invertColors ? "gray-6" : "gray-7"
  const showEntire = anchorId === event.id
  const interactive = !anchorId || !showEntire
  const muted = deriveMuted(event.id)

  let interval, border, childrenContainer, noteContainer

  const goToNote = data => modal.push({type: "note/detail", ...data})

  const onClick = e => {
    const target = e.target as HTMLElement

    if (interactive && !["I"].includes(target.tagName) && !target.closest("a")) {
      goToNote({note: event})
    }
  }

  const goToParent = () =>
    goToNote({note: {id: findReplyId(event), replies: [event]}, relays: getParentHints(event)})

  const goToThread = () =>
    modal.push({type: "thread/detail", anchorId: event.id, relays: getEventHints(event)})

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

  // Show only notes that were passed in by the parent unless we want to show all
  $: visibleNotes = ((showContext ? replies : note.replies) || []).filter(
    e => !feedRelay || e.seen_on.includes(feedRelay.url)
  )

  onMount(async () => {
    interval = setInterval(setBorderHeight, 400)

    if (!event.pubkey) {
      await load({
        relays: mergeHints([relays, getUserRelayUrls("read")]),
        filters: getIdFilters([event.id]),
        onEvent: e => {
          event = e
        },
      })
    }

    ;(window as any).NoteDetail = event

    const loadKinds = [7]

    if (ENABLE_ZAPS) {
      loadKinds.push(9735)
    }

    if (!context) {
      loadKinds.push(1)
    }

    const selectedRelays = mergeHints([relays, getReplyHints(event)])
    const loadFilters = [{kinds: loadKinds, "#e": [event.id]}]

    const onEvent = e => {
      switcherFn(e.kind.toString(), {
        "1": () => {
          if (!isEventMuted($mutes, e)) {
            if (findReplyId(e) === event.id) {
              replies = sortBy((e: Event) => -e.created_at, uniqBy(prop("id"), replies.concat(e)))
            }

            context = sortBy(
              (e: Event) => -e.created_at,
              uniqBy(prop("id"), (context || []).concat(e))
            )
          }
        },
        "7": () => {
          if (isLike(e.content) && findReplyId(e) === event.id) {
            likes = likes.concat(e)
          }
        },
        "9735": () => {
          if (findReplyId(e) === event.id) {
            const {zapper} = derivePerson(event.pubkey).get()

            zaps = zaps.concat(processZap(e, zapper)).filter(identity)
          }
        },
      })
    }

    load({relays: selectedRelays, filters: loadFilters, onEvent})

    if (event.pubkey) {
      loadPubkeys([event.pubkey])
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
          <Anchor
            class="text-lg font-bold"
            on:click={() => modal.push({type: "person/detail", pubkey: event.pubkey})}>
            <PersonCircle size={10} pubkey={event.pubkey} />
          </Anchor>
        </div>
        <div class="flex min-w-0 flex-grow flex-col gap-2">
          <div class="flex flex-col items-start justify-between sm:flex-row">
            <Anchor
              type="unstyled"
              class="pr-16 text-lg font-bold"
              on:click={() => modal.push({type: "person/detail", pubkey: event.pubkey})}>
              <PersonName pubkey={event.pubkey} />
            </Anchor>
            <Anchor
              href={"/" + nip19.neventEncode({id: event.id, relays: getEventHints(event)})}
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
            {#if $muted}
              <p class="border-l-2 border-solid border-gray-6 pl-4 text-gray-1">
                You have muted this note.
              </p>
            {:else}
              <NoteContent {anchorId} note={event} {showEntire} />
            {/if}
            <NoteActions
              note={event}
              muted={$muted}
              bind:this={actions}
              bind:replies
              bind:likes
              bind:zaps
              {reply}
              {setFeedRelay}
              {showEntire} />
          </div>
        </div>
      </Card>
    </div>

    {#if !replyIsActive && visibleNotes.length > 0 && !showEntire && depth > 0 && !$muted}
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
      {borderColor} />

    {#if !collapsed && visibleNotes.length > 0 && depth > 0 && !$muted}
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
              {context}
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
{/if}
