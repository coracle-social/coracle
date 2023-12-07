<script lang="ts">
  import {pluck} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {getParentId} from "src/util/nostr"
  import MobileInset from 'src/partials/MobileInset.svelte'
  import Note from "src/app/shared/Note.svelte"
  import NotificationPeople from "src/app/shared/NotificationPeople.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parentId = getParentId(interactions[0], "e")
  const note = parentId ? {id: parentId} : interactions[0]
</script>

<MobileInset class="flex justify-between">
  <NotificationPeople {notification} actionText="mentioned you" />
  <small>{formatTimestamp(timestamp)}</small>
</MobileInset>

<Note
  showLoading
  topLevel
  depth={1}
  {note}
  context={interactions}
  filters={[{ids: pluck("id", interactions)}]} />
