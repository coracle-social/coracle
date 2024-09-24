<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {getAddress} from "@welshman/util"
  import {secondsToDate, getLocale, formatTimestamp, formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"

  export let event

  const timeFmt = new Intl.DateTimeFormat(getLocale(), {timeStyle: "short"})

  $: meta = fromPairs(event.tags) as Record<string, string>
  $: end = parseInt(meta.end)
  $: start = parseInt(meta.start)
  $: startDate = secondsToDate(start)
  $: endDate = secondsToDate(end)
  $: startDateDisplay = formatTimestampAsDate(start)
  $: endDateDisplay = formatTimestampAsDate(end)
  $: isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="card2 flex items-center justify-between gap-2">
  <span>{meta.title || meta.name}</span>
  <div class="flex items-center gap-2 text-sm">
    <Icon icon="clock-circle" size={4} />
    {timeFmt.format(startDate)} — {isSingleDay ? timeFmt.format(endDate) : formatTimestamp(end)}
  </div>
</div>
