<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {ctx} from "@welshman/lib"
  import {Tags} from "@welshman/util"
  import {formatTimestamp} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import type {Notification} from "src/engine"
  import {deriveEvent} from "src/engine"

  export let notification: Notification

  const {timestamp, interactions} = notification
  const parent = Tags.fromEvent(interactions[0]).whereKey("e").parent()
  const relays = ctx.app.router.EventParents(interactions[0]).getUrls()
  const pubkeys = uniq(pluck("pubkey", interactions))

  // Make sure we have something to show, even if we can't load the parent
  const event = deriveEvent(parent?.value() || interactions[0]?.id, {relays})
</script>

<div>
  <div class="mb-4 flex justify-between">
    <PeopleAction {pubkeys} actionText="mentioned you" />
    <small>{formatTimestamp(timestamp)}</small>
  </div>
  {#if $event}
    <Note note={$event} topLevel showLoading depth={1} filters={[{ids: pluck("id", interactions)}]} />
  {:else}
    <Spinner />
  {/if}
</div>
