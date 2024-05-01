<script lang="ts">
  import {omit} from "ramda"
  import {FeedType} from "@welshman/feeds"
  import {createLocalDate, dateToSeconds, formatTimestampAsDate} from "src/util/misc"
  import Field from "src/partials/Field.svelte"
  import DateInput from "src/partials/DateInput.svelte"

  export let feed
  export let onChange

  const changeSince = since => {
    const value = since
      ? {...feed[1], since: dateToSeconds(createLocalDate(since).setHours(0, 0, 0, 0))}
      : omit(["since"], feed[1])

    onChange([FeedType.CreatedAt, value])
  }

  const changeUntil = until => {
    const value = until
      ? {...feed[1], until: dateToSeconds(createLocalDate(until).setHours(23, 59, 59, 0))}
      : omit(["until"], feed[1])

    onChange([FeedType.CreatedAt, value])
  }
</script>

<Field label="What time range would you like to consider?">
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
</Field>
