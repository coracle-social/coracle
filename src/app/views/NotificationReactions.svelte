<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {closure} from "hurdak"
  import {formatTimestamp} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import {modal} from "src/partials/state"
  import type {Notification} from "src/engine"
  import {EventKind} from "src/engine"

  export let notification: Notification

  const {event: note, interactions, timestamp} = notification
  const likes = interactions.filter(e => e.kind === EventKind.Reaction)
  const zaps = interactions.filter(e => e.kind === EventKind.ZapRequest)
  const pubkeys = uniq(pluck("pubkey", [...likes, ...zaps]))

  const actionText = closure(() => {
    if (likes.length === 0) return "zapped"
    if (zaps.length === 0) return "liked"

    return "reacted to"
  })
</script>

<Card
  interactive
  class="flex w-full flex-col gap-2 text-left"
  on:click={() => modal.push({type: "note/detail", note})}>
  <div on:click|stopPropagation class="flex justify-between">
    <NotificationPeople {pubkeys} actionText={`${actionText} your note`} />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <div class="break-word overflow-hidden text-gray-1">
    <NoteContent {note} />
  </div>
</Card>
