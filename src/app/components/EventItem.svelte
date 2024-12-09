<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"

  export let event

  $: meta = fromPairs(event.tags) as Record<string, string>
  $: end = parseInt(meta.end)
  $: start = parseInt(meta.start)
  $: startDateDisplay = formatTimestampAsDate(start)
  $: endDateDisplay = formatTimestampAsDate(end)
  $: isSingleDay = startDateDisplay === endDateDisplay
</script>

<div class="card2 flex items-center justify-between gap-2">
  <span>{meta.title || meta.name}</span>
  <div class="flex items-center gap-2 text-sm">
    <Icon icon="clock-circle" size={4} />
    {formatTimestampAsTime(start)} — {isSingleDay
      ? formatTimestampAsTime(end)
      : formatTimestamp(end)}
  </div>
</div>
