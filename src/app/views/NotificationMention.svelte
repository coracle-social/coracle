<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {Tags} from "@coracle.social/util"
  import {formatTimestamp} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Notification} from "src/engine"
  import {hints, dereferenceNote} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parent = Tags.fromEvent(interactions[0]).whereKey("e").parent()
  const note = parent ? {id: parent.value()} : interactions[0]
  const pubkeys = uniq(pluck("pubkey", interactions))

  // Make sure we have something to show, even if we can't load the parent
  const promise = !parent
    ? Promise.resolve(note)
    : dereferenceNote({
        eid: note.id,
        relays: hints.EventParents(interactions[0]).getUrls(),
      }).then(note => note || interactions[0])
</script>

<div>
  <div class="mb-4 flex justify-between">
    <PeopleAction {pubkeys} actionText="mentioned you" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  {#await promise}
    <Spinner />
  {:then note}
    <Note
      showLoading
      topLevel
      depth={1}
      {note}
      context={interactions}
      filters={[{ids: pluck("id", interactions)}]} />
  {/await}
</div>
