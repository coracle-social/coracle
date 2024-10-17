<script lang="ts">
  import {writable} from "svelte/store"
  import {assoc, sortBy, append} from "@welshman/lib"
  import {createEvent} from "@welshman/util"
  import type {EventContent, TrustedEvent} from "@welshman/util"
  import {repository, publishThunk} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {tagRoom, REPLY} from "@app/state"

  export let url, room, event: TrustedEvent

  const thunks = writable({} as Record<string, Thunk>)

  const replies = deriveEvents(repository, {
    filters: [{kinds: [REPLY], "#E": [event.id]}],
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
      tags.push(["K", String(event.kind)])
      tags.push(["E", event.id])
    } else {
      tags.push(["k", String(event.kind)])
      tags.push(["e", event.id])
    }

    const reply = createEvent(REPLY, {content, tags: append(tagRoom(room, url), tags)})
    const thunk = publishThunk({event: reply, relays: [url]})

    thunks.update(assoc(thunk.event.id, thunk))
  }
</script>

<div class="col-2">
  <div class="overflow-auto pt-3">
    <ChannelMessage {url} {room} {event} thunk={$thunks[event.id]} showPubkey />
    {#each sortBy(e => e.created_at, $replies) as reply (reply.id)}
      <ChannelMessage {url} {room} event={reply} thunk={$thunks[reply.id]} showPubkey hideParent />
    {/each}
  </div>
  <div class="bottom-0 left-0 right-0">
    <ChannelCompose {onSubmit} />
  </div>
</div>
