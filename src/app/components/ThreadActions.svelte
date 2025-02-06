<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatusOrDeleted from "@app/components/ThunkStatusOrDeleted.svelte"
  import EventActivity from "@app/components/EventActivity.svelte"
  import EventActions from "@app/components/EventActions.svelte"
  import {publishDelete, publishReaction} from "@app/commands"
  import {makeThreadPath} from "@app/routes"

  interface Props {
    url: any
    event: any
    showActivity?: boolean
  }

  const {url, event, showActivity = false}: Props = $props()

  const path = makeThreadPath(url, event.id)

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
    <EventActions {url} {event} noun="Thread" />
  </div>
</div>
