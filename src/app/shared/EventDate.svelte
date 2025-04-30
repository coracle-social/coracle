<script lang="ts">
  import {LOCALE, secondsToDate} from "@welshman/lib"
  import {getTagValue} from "@welshman/util"

  export let event

  const monthFmt = new Intl.DateTimeFormat(LOCALE, {month: "short"})
  const dayFmt = new Intl.DateTimeFormat(LOCALE, {day: "numeric"})

  $: date = secondsToDate(parseInt(getTagValue("start", event.tags)))
</script>

<div class="flex flex-col gap-1 px-12">
  <p class="text-center text-neutral-200">{monthFmt.format(date)}</p>
  <p class="text-center text-3xl">{dayFmt.format(date)}</p>
</div>
