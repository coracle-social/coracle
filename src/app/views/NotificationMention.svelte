<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {getParentId} from "src/util/nostr"
  import Note from "src/app/shared/Note.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parentId = getParentId(interactions[0], "e")
  const note = parentId ? {id: parentId} : interactions[0]
</script>

<div class="flex justify-between">
  <PeopleAction pubkeys={uniq(pluck("pubkey", interactions))} actionText="mentioned you" />
  <small>{formatTimestamp(timestamp)}</small>
</div>

<Note
  showLoading
  topLevel
  depth={1}
  {note}
  context={interactions}
  filters={[{ids: pluck("id", interactions)}]} />
