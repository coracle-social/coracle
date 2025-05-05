<script lang="ts">
  import {fromPairs, LOCALE, secondsToDate} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"

  type Props = {
    event: TrustedEvent
  }

  const {event}: Props = $props()
  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const startDate = $derived(secondsToDate(parseInt(meta.start)))
</script>

<div
  class="hidden h-32 w-32 min-w-32 flex-col items-center justify-center gap-1 rounded-box bg-base-300 p-2 sm:flex">
  <strong>{Intl.DateTimeFormat(LOCALE, {month: "short"}).format(startDate)}</strong>
  <span class="text-4xl">{Intl.DateTimeFormat(LOCALE, {day: "numeric"}).format(startDate)}</span>
  <span class="text-xs opacity-75"
    >{Intl.DateTimeFormat(LOCALE, {weekday: "long"}).format(startDate)}</span>
</div>
