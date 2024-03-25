<script lang="ts">
  import {Tags} from "@coracle.social/util"
  import {secondsToDate, getLocale} from "src/util/misc"

  export let event

  const date = secondsToDate(Tags.fromEvent(event).get("start")?.value())
  const monthFmt = new Intl.DateTimeFormat(getLocale(), {month: "short"})
  const dayFmt = new Intl.DateTimeFormat(getLocale(), {day: "numeric"})
</script>

<div class="flex flex-col gap-1 px-12">
  <p class="text-center text-neutral-200">{monthFmt.format(date)}</p>
  <p class="text-center text-3xl">{dayFmt.format(date)}</p>
</div>
