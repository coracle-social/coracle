<script lang="ts">
  import {pluck} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {event, interactions, timestamp} = notification
</script>

<div class="flex justify-between items-center">
  <NotificationPeople {notification} actionText="replied to your note" />
  <small>{formatTimestamp(timestamp)}</small>
</div>

<Note
  topLevel
  depth={1}
  note={event}
  context={interactions}
  filters={[{ids: pluck("id", interactions)}]} />
