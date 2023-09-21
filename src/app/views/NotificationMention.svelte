<script lang="ts">
  import {formatTimestamp} from "src/util/misc"
  import Note from "src/app/shared/Note.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const [note] = interactions
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-between">
    <NotificationPeople pubkeys={[note.pubkey]} actionText="mentioned you" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <Note topLevel depth={1} {note} />
</div>
