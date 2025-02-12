<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"

  type Props = {
    event: TrustedEvent
  }

  const {event}: Props = $props()
  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const start = $derived(parseInt(meta.start))
  const end = $derived(parseInt(meta.end))
  const startDateDisplay = $derived(formatTimestampAsDate(start))
  const endDateDisplay = $derived(formatTimestampAsDate(end))
  const isSingleDay = $derived(startDateDisplay === endDateDisplay)
</script>

<p class="text-xl">{meta.title || meta.name}</p>
<div class="flex items-center gap-2 text-sm">
  <Icon icon="clock-circle" size={4} />
  {formatTimestampAsTime(start)} — {isSingleDay ? formatTimestampAsTime(end) : formatTimestamp(end)}
</div>
