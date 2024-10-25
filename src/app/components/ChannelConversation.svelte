<script lang="ts">
  import {writable} from "svelte/store"
  import {assoc, sortBy, append} from "@welshman/lib"
  import type {EventContent, TrustedEvent} from "@welshman/util"
  import {repository} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {deriveEvents} from "@welshman/store"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {tagRoom, COMMENT} from "@app/state"
  import {publishComment} from "@app/commands"

  export let url, room, event: TrustedEvent

  const thunks = writable({} as Record<string, Thunk>)

  const replies = deriveEvents(repository, {
    filters: [{kinds: [COMMENT], "#E": [event.id]}],
  })

  const onSubmit = ({content, tags}: EventContent) => {
    const thunk = publishComment({
      event,
      content,
      tags: append(tagRoom(room, url), tags),
      relays: [url],
    })

    thunks.update(assoc(thunk.event.id, thunk))
  }
</script>

<div class="col-2">
  <div class="overflow-auto pt-3">
    <ChannelMessage {url} {room} {event} thunk={$thunks[event.id]} showPubkey isHead inert />
    {#each sortBy(e => e.created_at, $replies) as reply (reply.id)}
      <ChannelMessage {url} {room} event={reply} thunk={$thunks[reply.id]} showPubkey inert />
    {/each}
  </div>
  <div class="bottom-0 left-0 right-0">
    <ChannelCompose {onSubmit} />
  </div>
</div>
