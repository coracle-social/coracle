<script lang="ts">
  import {repository} from "@welshman/app"
  import {ctx} from "@welshman/lib"
  import {deriveEvents} from "@welshman/store"
  import {getIdOrAddress, getReplyFilters, isChildOf, matchFilters, NOTE} from "@welshman/util"
  import {quantify} from "hurdak"
  import {onMount, setContext} from "svelte"
  import NoteMeta from "src/app/shared/NoteMeta.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {ensureUnwrapped, getSetting, isEventMuted, loadEvent, sortEventsDesc} from "src/engine"
  import AltColor from "src/partials/AltColor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {fly, slide} from "src/util/transition"
  import {openReplies} from "src/app/state"

  export let note
  export let relays = []
  export let filters = null
  export let reposts = new Map()
  export let depth = 0
  export let anchor = null
  export let topLevel = false
  export let isLastReply = false
  export let showParent = true
  export let showLoading = false
  export let showMedia = getSetting("show_media")

  setContext("topLevel", topLevel)

  let ready = false
  let event = note
  let showMutedReplies = false
  let collapsed = depth === 0
  let showHiddenReplies = anchor === getIdOrAddress(event)
  let draftEventId: string

  const showEntire = showHiddenReplies

  const context = deriveEvents(repository, {filters: getReplyFilters([event])})

  $: children = $context.filter(e => isChildOf(e, event))
  $: replies = sortEventsDesc(children.filter(e => e.kind === NOTE))
  $: replyIsActive = $openReplies[event.id]

  let mutedReplies, hiddenReplies, visibleReplies

  $: {
    mutedReplies = []
    hiddenReplies = []
    visibleReplies = []

    for (const e of replies) {
      if ($isEventMuted(e)) {
        mutedReplies.push(e)
      } else if (collapsed) {
        hiddenReplies.push(e)
      } else if (
        !showHiddenReplies &&
        filters &&
        !matchFilters(filters, e) &&
        draftEventId !== e.id
      ) {
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

  onMount(async () => {
    if (!event.pubkey) {
      event = await loadEvent(event.id, {
        relays: ctx.app.router.FromRelays(relays).getUrls(),
      })
    }

    event = await ensureUnwrapped(event)

    if (event.pubkey) {
      ready = true
    }
  })
</script>

{#if ready}
  <div>
    <NoteMeta {reposts} note={event} />
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
      <div class="pt-4">
        <Note note={event} {showEntire} {showParent} {showMedia} />
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

      {#if visibleReplies.length > 0 || hiddenReplies.length > 0 || mutedReplies.length > 0}
        <div
          class="note-children relative ml-4 flex flex-col"
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
