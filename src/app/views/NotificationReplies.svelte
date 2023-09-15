<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import Card from "src/partials/Card.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import {modal} from "src/partials/state"
  import type {Notification} from "src/engine2/model"

  export let notification: Notification

  const {event: note, interactions, timestamp} = notification
  const replies = interactions.filter(e => noteKinds.includes(e.kind))
  const pubkeys = uniq(pluck("pubkey", replies))
</script>

<Card
  interactive
  class="flex w-full flex-col gap-2 text-left"
  on:click={() => modal.push({type: "note/detail", note})}>
  <div on:click|stopPropagation class="flex justify-between">
    <NotificationPeople {pubkeys} actionText="replied to your note" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <div class="break-word overflow-hidden text-gray-1">
    <NoteContent {note} />
  </div>
</Card>
