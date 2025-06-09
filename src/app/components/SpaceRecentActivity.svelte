<script lang="ts">
  import {derived} from "svelte/store"
  import {groupBy, ago, MONTH, first, last, uniq, avg, overlappingPairs} from "@welshman/lib"
  import {formatTimestamp} from "@welshman/lib"
  import {MESSAGE, getTagValue} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {deriveEventsForUrl} from "@app/state"
  import {goToEvent} from "@app/routes"

  type Props = {
    url: string
  }

  const {url}: Props = $props()
  const since = ago(MONTH)
  const messages = deriveEventsForUrl(url, [{kinds: [MESSAGE], since}])

  const conversations = derived(messages, $messages => {
    const convs = []

    for (const [room, messages] of groupBy(e => getTagValue("h", e.tags), $messages).entries()) {
      const avgTime = avg(overlappingPairs(messages).map(([a, b]) => a.created_at - b.created_at))
      const groups: TrustedEvent[][] = []
      const group: TrustedEvent[] = []

      // Group conversations by time between messages
      let prevCreatedAt = messages[0].created_at
      for (const message of messages) {
        if (prevCreatedAt - message.created_at < avgTime) {
          group.push(message)
        } else {
          groups.push(group.splice(0))
        }

        prevCreatedAt = message.created_at
      }

      if (group.length > 0) {
        groups.push(group.splice(0))
      }

      // Convert each group into a conversation
      for (const events of groups) {
        if (events.length < 2) {
          continue
        }

        const latest = first(events)!
        const earliest = last(events)!
        const participants = uniq(events.map(msg => msg.pubkey))

        convs.push({room, events, latest, earliest, participants})
      }
    }

    return convs
  })

  const viewMore = () => {
    limit += 3
  }

  let limit = $state(3)
</script>

<div class="card2 bg-alt">
  <div class="flex flex-col gap-4">
    <h3 class="flex items-center gap-2 text-lg font-semibold">
      <Icon icon="chat-round" />
      Recent Conversations
    </h3>
    <div class="flex flex-col gap-4">
      {#if $conversations.length === 0}
        <div class="py-8 text-center opacity-70">
          <p>No recent conversations</p>
        </div>
      {:else}
        {#each $conversations.slice(0, limit) as { room, events, latest, earliest, participants } (latest.id)}
          <Button class="card2 bg-alt" onclick={() => goToEvent(earliest)}>
            <div class="flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <ProfileCircle pubkey={earliest.pubkey} size={10} />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 text-sm opacity-70">
                    <span class="font-medium text-blue-400">#{room}</span>
                    <span class="opacity-50">•</span>
                    <span>{formatTimestamp(earliest.created_at)}</span>
                  </div>
                  <Content minimalQuote minLength={100} maxLength={400} event={earliest} />
                </div>
              </div>
              <div class="ml-13 flex items-center justify-between">
                <div class="flex gap-1">
                  <Icon icon="alt-arrow-left" />
                  <span class="text-sm opacity-70">
                    {events.length} messages
                  </span>
                </div>
                <div class="flex gap-2">
                  <ProfileCircles pubkeys={participants} size={6} />
                  <span class="text-sm opacity-70">
                    {participants.length} participants
                  </span>
                </div>
              </div>
              <Button class="card2 bg-alt" onclick={() => goToEvent(latest)}>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm opacity-70">
                      <ProfileCircle pubkey={latest.pubkey} size={5} />
                      <span class="font-medium">Latest reply:</span>
                    </div>
                    <span class="text-xs opacity-50">
                      {formatTimestamp(latest.created_at)}
                    </span>
                  </div>
                  <Content minimalQuote minLength={100} maxLength={400} event={latest} />
                </div>
              </Button>
            </div>
          </Button>
        {/each}
        {#if $conversations.length > limit}
          <Button class="btn btn-primary" onclick={viewMore}>
            View more conversations
            <Icon icon="alt-arrow-down" />
          </Button>
        {/if}
      {/if}
    </div>
  </div>
</div>
