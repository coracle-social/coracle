<script lang="ts">
  import {fromPairs} from "ramda"
  import {Tags} from "@welshman/util"
  import {deriveIsDeletedByAddress} from "@welshman/store"
  import {repository} from "@welshman/app"
  import {secondsToDate, formatTimestamp, formatTimestampAsDate, getLocale} from "src/util/misc"
  import Chip from "src/partials/Chip.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {getSetting} from "src/engine"

  export let event
  export let showDate = false

  const timeFmt = new Intl.DateTimeFormat(getLocale(), {timeStyle: "short"})
  const datetimeFmt = new Intl.DateTimeFormat(getLocale(), {dateStyle: "short", timeStyle: "short"})
  const deleted = deriveIsDeletedByAddress(repository, event)

  $: tags = Tags.fromEvent(event)
  $: ({name, title, location} = fromPairs(event.tags))
  $: end = parseInt(tags.get("end")?.value())
  $: start = parseInt(tags.get("start")?.value())
  $: startDate = secondsToDate(start)
  $: endDate = secondsToDate(end)
  $: startDateDisplay = formatTimestampAsDate(start)
  $: endDateDisplay = formatTimestampAsDate(end)
  $: isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="flex flex-grow flex-col gap-2">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="text-2xl" class:line-through={$deleted}>
        {title || name}
      </div>
      {#if $deleted}
        <Chip danger small>Deleted</Chip>
      {/if}
    </div>
  </div>
  <div class="flex items-center gap-2 text-sm text-neutral-200">
    {#if event.wrap}
      <span>Private</span>
      <span>•</span>
    {/if}
    <span>
      Created by
      <PersonLink pubkey={event.pubkey} />
    </span>
  </div>
  <div class="h-px bg-neutral-600" />
  <div class="flex items-center gap-2 text-sm text-neutral-200">
    <i class="fa fa-clock" />
    {#if showDate}
      Starts on {datetimeFmt.format(startDate)} — {isSingleDay
        ? timeFmt.format(endDate)
        : formatTimestamp(end)}
    {:else}
      Starts at {timeFmt.format(startDate)} — {isSingleDay
        ? timeFmt.format(endDate)
        : formatTimestamp(end)}
    {/if}
    <span class="w-2" />
    <i class="fa fa-location-dot" />
    {location || "No location"}
  </div>
  <NoteContentKind1 showEntire showMedia={getSetting("show_media")} note={event} />
</div>
