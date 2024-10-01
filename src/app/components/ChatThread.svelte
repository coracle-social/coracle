<script lang="ts">
  import {sortBy, append, range} from '@welshman/lib'
  import {createEvent} from '@welshman/util'
  import type {EventContent, TrustedEvent} from '@welshman/util'
  import {repository, makeThunk, publishThunk} from '@welshman/app'
  import {deriveEvents} from '@welshman/store'
  import ChatMessage from '@app/components/ChatMessage.svelte'
  import ChatCompose from '@app/components/ChatCompose.svelte'
  import {tagRoom, REPLY} from '@app/state'

  export let url, room, event: TrustedEvent

  const replies = deriveEvents(repository, {
    filters: [{kinds: [REPLY], '#E': [event.id]}],
  })

  const onSubmit = ({content, tags}: EventContent) => {
    const seenRoots = new Set<string>()

    for (const [raw, ...tag] of event.tags.filter(t => t[0].match(/^K|E|A|I$/i))) {
      const T = raw.toUpperCase()
      const t = raw.toLowerCase()

      if (seenRoots.has(T)) {
        tags.push([t, ...tag])
      } else {
        tags.push([T, ...tag])
        seenRoots.add(T)
      }
    }

    if (seenRoots.size === 0) {
      tags.push(['K', String(event.kind)])
      tags.push(['E', event.id])
    } else {
      tags.push(['k', String(event.kind)])
      tags.push(['e', event.id])
    }

    const reply = createEvent(REPLY, {content, tags: append(tagRoom(room, url), tags)})

    publishThunk(makeThunk({event: reply, relays: [url]}))
  }
</script>

<div class="fixed flex flex-col max-h-screen w-full gap-2">
  <div class="overflow-auto pt-3">
    <ChatMessage {url} {room} {event} showPubkey />
    {#each sortBy(e => e.created_at, $replies) as reply (reply.id)}
      <ChatMessage {url} {room} event={reply} showPubkey hideParent />
    {/each}
  </div>
  <div class="bottom-0 left-0 right-0">
    <ChatCompose {onSubmit} />
  </div>
</div>
