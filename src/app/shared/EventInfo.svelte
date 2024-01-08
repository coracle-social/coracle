<script lang="ts">
  import {Tags} from "paravel"
  import {Naddr} from "src/util/nostr"
  import {secondsToDate, formatTimestamp, formatTimestampAsDate} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import GroupLink from "src/app/shared/GroupLink.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import {router} from "src/app/router"

  export let event

  const timeFmt = new Intl.DateTimeFormat("en-US", {timeStyle: "short"})
  const groupAddrs = Tags.from(event).circles().all()
  const address = Naddr.fromEvent(event).asTagValue()
  const {name, start, end, location} = Tags.from(event).getDict()
  const startDate = secondsToDate(start)
  const endDate = secondsToDate(end)
  const startDateDisplay = formatTimestampAsDate(start)
  const endDateDisplay = formatTimestampAsDate(end)
  const isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="flex flex-grow flex-col gap-2">
  <div class="flex justify-between">
    <Anchor class="text-2xl" href={router.at("events").of(address).toString()}>{name}</Anchor>
    <slot />
  </div>
  <div class="flex gap-2 text-sm text-lighter">
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
    Starts at {timeFmt.format(startDate)} — {isSingleDay
      ? timeFmt.format(endDate)
      : formatTimestamp(end)}
    <span class="w-2" />
    <i class="fa fa-location-dot" />
    {location || "No location"}
  </div>
</div>
