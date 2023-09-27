<script lang="ts">
  import {formatTimestamp} from "src/util/misc"
  import {findReplyId} from "src/util/nostr"
  import Note from "src/app/shared/Note.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parentId = findReplyId(interactions[0])

  let note
  if (parentId) {
    note = {id: parentId, replies: interactions}
  } else {
    note = interactions[0]
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-between">
    <NotificationPeople {notification} actionText="mentioned you" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  <Note showLoading topLevel depth={1} {note} />
</div>
