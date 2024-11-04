<script lang="ts">
  import cx from "classnames"
  import {fromPairs} from "ramda"
  import {Tags, getAddress} from "@welshman/util"
  import {deriveIsDeletedByAddress} from "@welshman/store"
  import {repository, pubkey} from "@welshman/app"
  import {secondsToDate, formatTimestamp, formatTimestampAsDate, getLocale} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import EventActions from "src/app/shared/EventActions.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from "src/app/util/router"
  import {getSetting} from "src/engine"

  export let event
  export let showDate = false
  export let actionsInline = false

  const address = getAddress(event)
  const timeFmt = new Intl.DateTimeFormat(getLocale(), {timeStyle: "short"})
  const datetimeFmt = new Intl.DateTimeFormat(getLocale(), {dateStyle: "short", timeStyle: "short"})
  const detailPath = router.at("events").of(address).toString()
  const editLink = router.at("events").of(address).at("edit").toString()
  const deleteLink = router.at("events").of(address).at("delete").toString()
  const deleted = deriveIsDeletedByAddress(repository, event)

  $: tags = Tags.fromEvent(event)
  $: groupAddrs = tags.context().values().valueOf()
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
      <Anchor class={cx("text-2xl", {"line-through": $deleted})} href={detailPath}>
        {title || name}
      </Anchor>
      {#if $deleted}
        <Chip danger small>Deleted</Chip>
      {/if}
      {#if actionsInline && event.pubkey === $pubkey && !$deleted}
        <Anchor modal stopPropagation href={editLink} class="flex items-center">
          <i class="fa fa-edit text-base text-neutral-200" />
        </Anchor>
        <Anchor modal stopPropagation href={deleteLink} class="flex items-center">
          <i class="fa fa-trash text-base text-neutral-200" />
        </Anchor>
      {/if}
    </div>
    {#if !actionsInline}
      <EventActions {event} />
    {/if}
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
