<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {ctx} from "@welshman/lib"
  import {getAncestorTagValues} from "@welshman/util"
  import {formatTimestamp} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Notification} from "src/engine"
  import {deriveEvent} from 'src/engine'

  export let notification: Notification

  const {timestamp, interactions} = notification
  const root = getAncestorTagValues(interactions[0].tags).replies[0] || interactions[0].id
  const event = deriveEvent(root)
</script>

<div class="my-4">
  <div class="mb-4 flex justify-between">
    <PeopleAction pubkeys={uniq(pluck("pubkey", interactions))} actionText="mentioned you" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  {#if $event}
    <Note
      topLevel
      showLoading
      depth={1}
      note={$event}
      filters={[{ids: pluck("id", interactions)}]}
      relays={ctx.app.router.EventParents(interactions[0]).getUrls()} />
  {:else}
    <Spinner />
  {/if}
</div>
