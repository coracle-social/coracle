<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"

  let {event} = $props()

  let meta = $derived(fromPairs(event.tags) as Record<string, string>)
  let end = $derived(parseInt(meta.end))
  let start = $derived(parseInt(meta.start))
  let startDateDisplay = $derived(formatTimestampAsDate(start))
  let endDateDisplay = $derived(formatTimestampAsDate(end))
  let isSingleDay = $derived(startDateDisplay === endDateDisplay)
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
