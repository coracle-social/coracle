<script lang="ts">
  import {formatTimestamp} from "src/util/misc"
  import {noteKinds, LOCAL_RELAY_URL} from "src/util/nostr"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Notification} from "src/engine"
  import {sortEventsDesc} from "src/engine"

  export let notification: Notification

  const {event: note, interactions, timestamp} = notification
  const replies = sortEventsDesc(interactions.filter(e => noteKinds.includes(e.kind)))
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-between">
    <NotificationPeople {notification} actionText="replied to your note" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <Note topLevel depth={1} relays={[LOCAL_RELAY_URL]} note={{...note, replies}} />
</div>
