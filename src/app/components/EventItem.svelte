<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"

  const {event} = $props()

  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const end = $derived(parseInt(meta.end))
  const start = $derived(parseInt(meta.start))
  const startDateDisplay = $derived(formatTimestampAsDate(start))
  const endDateDisplay = $derived(formatTimestampAsDate(end))
  const isSingleDay = $derived(startDateDisplay === endDateDisplay)
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
