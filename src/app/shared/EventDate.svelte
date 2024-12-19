<script lang="ts">
  import {getTagValue} from "@welshman/util"
  import {secondsToDate, getLocale} from "src/util/misc"

  export let event

  const monthFmt = new Intl.DateTimeFormat(getLocale(), {month: "short"})
  const dayFmt = new Intl.DateTimeFormat(getLocale(), {day: "numeric"})

  $: date = secondsToDate(getTagValue("start", event.tags))
</script>

<div class="flex flex-col gap-1 px-12">
  <p class="text-center text-neutral-200">{monthFmt.format(date)}</p>
  <p class="text-center text-3xl">{dayFmt.format(date)}</p>
</div>
