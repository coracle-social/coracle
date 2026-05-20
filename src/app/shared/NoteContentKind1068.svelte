<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {POLL_RESPONSE, getTagValues} from "@welshman/util"
  import {formatTimestampRelative} from "@welshman/lib"
  import {Router} from "@welshman/router"
  import {repository, signer, pubkey} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import {myLoad, publishPollResponse, deleteEvent} from "src/engine"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {
    getPollType,
    getPollOptions,
    getPollEndsAt,
    getPollResponseSelections,
    getPollResults,
    isPollClosed,
  } from "src/util/polls"

  export let note: TrustedEvent
  export let showEntire = false
  export let showMedia = false

  const pollType = getPollType(note)
  const options = getPollOptions(note)
  const endsAt = getPollEndsAt(note)
  const filters = [{kinds: [POLL_RESPONSE], "#e": [note.id]}]
  const responses = deriveEvents({repository, filters})

  const getOwnResponse = (events: TrustedEvent[]) => {
    let latest: TrustedEvent | undefined

    for (const event of events) {
      if (event.pubkey !== $pubkey) continue

      if (!latest || event.created_at > latest.created_at) {
        latest = event
      }
    }

    return latest
  }

  const onOptionClick = (id: string) => {
    if (!$signer || closed) return

    if (pollType === "singlechoice") {
      selectedIds = [id]
    } else {
      selectedIds = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id]
    }

    const previousResponses = $responses.filter(response => response.pubkey === $pubkey)

    if (selectedIds.length > 0 || previousResponses.length > 0) {
      publishPollResponse({event: note, selectedIds})
    }

    // Replace our prior responses so superseded votes don't linger on relays
    for (const response of previousResponses) {
      deleteEvent(response)
    }
  }

  let selectedIds: string[] = []

  $: closed = isPollClosed(note)
  $: canVote = Boolean($signer) && !closed
  $: results = getPollResults(note, $responses)
  $: ownResponse = getOwnResponse($responses)

  // Keep the displayed selection in sync with our latest published response
  $: if (ownResponse) {
    selectedIds = getPollResponseSelections(ownResponse, pollType)
  }

  onMount(() => {
    const router = Router.get()
    const relays = router
      .merge([router.FromRelays(getTagValues("relay", note.tags)), router.Replies(note)])
      .getUrls()

    myLoad({relays, filters})
  })
</script>

<div class="flex flex-col gap-3">
  {#if note.content}
    <NoteContentKind1 {note} {showEntire} {showMedia} />
  {/if}
  <div class="flex flex-col gap-2">
    {#each options as option (option.id)}
      {@const votes = results.options.find(o => o.id === option.id)?.votes || 0}
      {@const percent = results.voters > 0 ? Math.round((votes / results.voters) * 100) : 0}
      {@const selected = selectedIds.includes(option.id)}
      <button
        type="button"
        disabled={!canVote}
        on:click|stopPropagation={() => onOptionClick(option.id)}
        class={cx(
          "relative w-full overflow-hidden rounded border border-solid border-neutral-600 text-left",
          {"cursor-pointer hover:border-neutral-500": canVote},
        )}>
        <div
          class="absolute inset-y-0 left-0 bg-neutral-700 transition-all duration-500"
          style={`width: ${percent}%`}>
        </div>
        <div class="relative flex items-center justify-between gap-3 px-3 py-2">
          <span class="flex min-w-0 items-center gap-2">
            {#if canVote}
              <i
                class={cx("fa", {
                  "fa-circle-dot text-accent": pollType === "singlechoice" && selected,
                  "fa-circle": pollType === "singlechoice" && !selected,
                  "fa-square-check text-accent": pollType === "multiplechoice" && selected,
                  "fa-square": pollType === "multiplechoice" && !selected,
                })}>
              </i>
            {:else if selected}
              <i class="fa fa-check text-accent"></i>
            {/if}
            <span class="truncate">{option.label}</span>
          </span>
          <span class="whitespace-nowrap text-sm opacity-75">{percent}% ({votes})</span>
        </div>
      </button>
    {/each}
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2 text-sm opacity-75">
    <span>
      {pollType === "multiplechoice" ? "Multiple choice" : "Single choice"}
      {#if endsAt}
        • {closed ? "Ended" : "Ends"}
        {formatTimestampRelative(endsAt)}
      {/if}
    </span>
    <span>{results.voters} {results.voters === 1 ? "vote" : "votes"}</span>
  </div>
</div>
