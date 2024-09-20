<script lang="ts">
  import cx from "classnames"
  import {fromPairs} from "@welshman/lib"
  import {Tags, getAddress} from "@welshman/util"
  import {repository, pubkey, secondsToDate, getLocale, formatTimestamp, formatTimestampAsDate, deriveProfileDisplay} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"

  export let event

  const address = getAddress(event)
  const timeFmt = new Intl.DateTimeFormat(getLocale(), {timeStyle: "short"})
  const datetimeFmt = new Intl.DateTimeFormat(getLocale(), {dateStyle: "short", timeStyle: "short"})
  const profileDisplay = deriveProfileDisplay(event.pubkey)

  $: meta = fromPairs(event.tags) as Record<string, string>
  $: end = parseInt(meta.end)
  $: start = parseInt(meta.start)
  $: startDate = secondsToDate(start)
  $: endDate = secondsToDate(end)
  $: startDateDisplay = formatTimestampAsDate(start)
  $: endDateDisplay = formatTimestampAsDate(end)
  $: isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="card2 flex justify-between items-center gap-2">
  <span>{meta.title || meta.name}</span>
  <div class="flex items-center gap-2 text-sm">
    <Icon icon="clock-circle" size={4} />
    {timeFmt.format(startDate)} — {isSingleDay ? timeFmt.format(endDate) : formatTimestamp(end)}
  </div>
</div>
