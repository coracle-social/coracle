<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {Tags} from "paravel"
  import {formatTimestamp} from "src/util/misc"
  import Note from "src/app/shared/Note.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parent = Tags.fromEvent(interactions[0]).whereKey("e").parent()
  const note = parent ? {id: parent.value()} : interactions[0]
</script>

<div>
  <div class="mb-4 flex justify-between">
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
</div>
