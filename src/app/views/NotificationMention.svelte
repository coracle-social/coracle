<script lang="ts">
  import {formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import type {Notification} from "src/engine2"

  export let notification: Notification

  const [note] = notification.interactions
</script>

<Card
  interactive
  class="flex w-full flex-col gap-2 text-left"
  on:click={() => modal.push({type: "note/detail", note})}>
  <div on:click|stopPropagation class="flex justify-between">
    <NotificationPeople pubkeys={[note.pubkey]} actionText="mentioned you" />
    <small>{formatTimestamp(notification.timestamp)}</small>
  </div>
  <div class="break-word overflow-hidden text-gray-1">
    <NoteContent {note} />
  </div>
</Card>
