<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import {omit, createLocalDate, dateToSeconds, formatTimestampAsDate} from "@welshman/lib"
  import DateInput from "src/partials/DateInput.svelte"

  export let feed
  export let onChange

  const changeSince = since => {
    if (since) {
      const date = createLocalDate(since)

      date.setHours(0, 0, 0, 0)

      onChange([FeedType.CreatedAt, {...feed[1], since: dateToSeconds(date)}])
    } else {
      onChange([FeedType.CreatedAt, omit(["since"], feed[1])])
    }
  }

  const changeUntil = until => {
    if (until) {
      const date = createLocalDate(until)

      date.setHours(23, 59, 59, 0)

      onChange([FeedType.CreatedAt, {...feed[1], until: dateToSeconds(date)}])
    } else {
      onChange([FeedType.CreatedAt, omit(["until"], feed[1])])
    }
  }
</script>

<span class="staatliches text-lg">What time range would you like to consider?</span>
<div class="grid grid-cols-2 gap-2">
  <DateInput
    placeholder="Since"
    value={feed[1]?.since ? formatTimestampAsDate(feed[1]?.since) : null}
    onChange={changeSince} />
  <DateInput
    placeholder="Until"
    value={feed[1]?.until ? formatTimestampAsDate(feed[1]?.until) : null}
    onChange={changeUntil} />
</div>
