<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import CalendarEventActions from "@app/components/CalendarEventActions.svelte"
  import CalendarEventHeader from "@app/components/CalendarEventHeader.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"
  import {makeCalendarPath} from "@app/routes"

  type Props = {
    url: string
    event: TrustedEvent
  }

  const {url, event}: Props = $props()
</script>

<Link class="col-3 card2 bg-alt w-full cursor-pointer" href={makeCalendarPath(url, event.id)}>
  <div class="flex items-center justify-between gap-2">
    <CalendarEventHeader {event} />
  </div>
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <span class="whitespace-nowrap py-1 text-sm opacity-75">
      Posted by <ProfileLink pubkey={event.pubkey} />
    </span>
    <CalendarEventActions showActivity {url} {event} />
  </div>
</Link>
