<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {event, interactions, timestamp} = notification
</script>

<div class="flex items-center justify-between">
  <PeopleAction pubkeys={uniq(pluck("pubkey", interactions))} actionText="replied to your note" />
  <small>{formatTimestamp(timestamp)}</small>
</div>

<Note
  topLevel
  depth={1}
  note={event}
  context={interactions}
  filters={[{ids: pluck("id", interactions)}]} />
