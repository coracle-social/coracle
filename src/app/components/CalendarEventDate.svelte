<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {LOCALE, secondsToDate} from "@welshman/app"

  type Props = {
    event: TrustedEvent
  }

  const {event}: Props = $props()
  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const startDate = $derived(secondsToDate(parseInt(meta.start)))
</script>

<div
  class="flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-box border border-solid border-base-content p-2 sm:h-24 sm:w-24">
  <span class="sm:text-lg">{Intl.DateTimeFormat(LOCALE, {month: "short"}).format(startDate)}</span>
  <span class="sm:text-4xl">{Intl.DateTimeFormat(LOCALE, {day: "numeric"}).format(startDate)}</span>
</div>
