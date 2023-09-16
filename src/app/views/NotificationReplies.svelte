<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {noteKinds, asDisplayEvent} from "src/util/nostr"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Notification} from "src/engine2/model"

  export let notification: Notification

  const {event: note, interactions, timestamp} = notification
  const replies = interactions.filter(e => noteKinds.includes(e.kind))
  const pubkeys = uniq(pluck("pubkey", replies))
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-between">
    <NotificationPeople {pubkeys} actionText="replied to your note" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <Note topLevel note={asDisplayEvent(note)} />
  <div class="ml-8 flex flex-col gap-4">
    {#each replies as reply (reply.id)}
      <Note topLevel showParent={false} note={asDisplayEvent(reply)} />
    {/each}
  </div>
</div>
