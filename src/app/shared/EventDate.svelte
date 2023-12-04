<script lang="ts">
  import {Tags} from 'paravel'
  import {secondsToDate} from "src/util/misc"

  export let event

  const date = secondsToDate(Tags.from(event).getValue("start"))
  const monthFmt = new Intl.DateTimeFormat("en-US", {month: 'short'})
  const dayFmt = new Intl.DateTimeFormat("en-US", {day: 'numeric'})
</script>

<div class="flex flex-col gap-1 px-12">
  <p class="text-gray-4 text-center">{monthFmt.format(date)}</p>
  <p class="text-3xl text-center">{dayFmt.format(date)}</p>
</div>
