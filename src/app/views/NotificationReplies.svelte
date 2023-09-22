<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Notification} from "src/engine"

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
  <Note topLevel depth={1} note={{...note, replies}} />
</div>
