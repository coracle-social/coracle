<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import CalendarEventActions from "@app/components/CalendarEventActions.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import {makeCalendarPath} from "@app/routes"

  const {
    url,
    event,
  }: {
    url: string
    event: TrustedEvent
  } = $props()

  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const end = $derived(parseInt(meta.end))
  const start = $derived(parseInt(meta.start))
  const startDateDisplay = $derived(formatTimestampAsDate(start))
  const endDateDisplay = $derived(formatTimestampAsDate(end))
  const isSingleDay = $derived(startDateDisplay === endDateDisplay)
</script>

<Link class="col-3 card2 bg-alt w-full cursor-pointer" href={makeCalendarPath(url, event.id)}>
  <div class="flex items-center justify-between gap-2">
    <p class="text-xl">{meta.title || meta.name}</p>
    <div class="flex items-center gap-2 text-sm">
      <Icon icon="clock-circle" size={4} />
      {formatTimestampAsTime(start)} — {isSingleDay
        ? formatTimestampAsTime(end)
        : formatTimestamp(end)}
    </div>
  </div>
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <span class="whitespace-nowrap py-1 text-sm opacity-75">
      Posted by <ProfileLink pubkey={event.pubkey} />
    </span>
    <CalendarEventActions showActivity {url} {event} />
  </div>
</Link>
