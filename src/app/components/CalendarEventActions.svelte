<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatusOrDeleted from "@app/components/ThunkStatusOrDeleted.svelte"
  import EventActivity from "@app/components/EventActivity.svelte"
  import EventActions from "@app/components/EventActions.svelte"
  import CalendarEventEdit from "@app/components/CalendarEventEdit.svelte"
  import {publishDelete, publishReaction} from "@app/commands"
  import {makeCalendarPath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const {
    url,
    event,
    showActivity = false,
  }: {
    url: string
    event: TrustedEvent
    showActivity?: boolean
  } = $props()

  const path = makeCalendarPath(url, event.id)

  const editEvent = () => pushModal(CalendarEventEdit, {url, event})

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({event, content, relays: [url]})
    }
  }
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <div class="flex flex-grow flex-wrap justify-end gap-2">
    <ReactionSummary {url} {event} {onReactionClick} reactionClass="tooltip-left" />
    <ThunkStatusOrDeleted {event} />
    {#if showActivity}
      <EventActivity {url} {path} {event} />
    {/if}
    <EventActions {url} {event} noun="Event">
      {#snippet customActions()}
        {#if event.pubkey === $pubkey}
          <li>
            <Button onclick={editEvent}>
              <Icon size={4} icon="pen" />
              Edit Event
            </Button>
          </li>
        {/if}
      {/snippet}
    </EventActions>
  </div>
</div>
