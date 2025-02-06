<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {formatTimestamp, formatTimestampAsDate, formatTimestampAsTime} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import CalendarEventActions from "@app/components/CalendarEventActions.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {makeCalendarPath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const {url, event} = $props()

  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
  const end = $derived(parseInt(meta.end))
  const start = $derived(parseInt(meta.start))
  const startDateDisplay = $derived(formatTimestampAsDate(start))
  const endDateDisplay = $derived(formatTimestampAsDate(end))
  const isSingleDay = $derived(startDateDisplay === endDateDisplay)

  const openProfile = () => pushModal(ProfileDetail, {pubkey: event.pubkey})
</script>

<Link class="col-2 card2 bg-alt w-full cursor-pointer" href={makeCalendarPath(url, event.id)}>
  <div class="flex items-center justify-between gap-2">
    <span>{meta.title || meta.name}</span>
    <div class="flex items-center gap-2 text-sm">
      <Icon icon="clock-circle" size={4} />
      {formatTimestampAsTime(start)} — {isSingleDay
        ? formatTimestampAsTime(end)
        : formatTimestamp(end)}
    </div>
  </div>
  <Content {event} />
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <span class="whitespace-nowrap py-1 text-sm opacity-75">
      Posted by
      <Button onclick={preventDefault(openProfile)} class="link-content">
        @<ProfileName pubkey={event.pubkey} />
      </Button>
    </span>
    <CalendarEventActions {url} {event} />
  </div>
</Link>
