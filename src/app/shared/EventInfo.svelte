<script lang="ts">
  import cx from "classnames"
  import {Tags} from "paravel"
  import {Naddr} from "src/util/nostr"
  import {secondsToDate, formatTimestamp, formatTimestampAsDate} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import GroupLink from "src/app/shared/GroupLink.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import EventActions from "src/app/shared/EventActions.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {router} from "src/app/router"
  import {isDeleted, getSetting} from "src/engine"

  export let event
  export let showDate = false
  export let showActions = false

  const timeFmt = new Intl.DateTimeFormat("en-US", {timeStyle: "short"})
  const datetimeFmt = new Intl.DateTimeFormat("en-US", {dateStyle: "short", timeStyle: "short"})
  const groupAddrs = Tags.from(event).circles().all()
  const address = Naddr.fromEvent(event).asTagValue()
  const detailPath = router.at("events").of(address).toString()
  const {title, start, end, location} = Tags.from(event).getDict()
  const startDate = secondsToDate(start)
  const endDate = secondsToDate(end)
  const startDateDisplay = formatTimestampAsDate(start)
  const endDateDisplay = formatTimestampAsDate(end)
  const isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="flex flex-grow flex-col gap-2">
  <div class="flex items-center justify-between">
    <Anchor class={cx("text-2xl", {"line-through": $isDeleted(event)})} href={detailPath}>
      {title}
    </Anchor>
    {#if showActions}
      <EventActions {event} />
    {/if}
  </div>
  <div class="flex items-center gap-2 text-sm text-lighter">
    {#if event.wrap}
      <span>Private</span>
      <span>•</span>
    {/if}
    <span>
      Created by
      <PersonLink pubkey={event.pubkey} />
    </span>
    {#if groupAddrs.length > 0}
      <span>•</span>
      <span>
        Posted in
        {#if groupAddrs.length === 1}
          <GroupLink address={groupAddrs[0]} />
        {:else}
          {groupAddrs.length} groups
        {/if}
      </span>
    {/if}
  </div>
  <div class="h-px bg-mid" />
  <div class="flex items-center gap-2 text-sm text-lighter">
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
