<script lang="ts">
  import {pluck, uniq} from "ramda"
  import {closure} from "hurdak"
  import {tracker} from "@welshman/app"
  import {formatTimestamp} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import {router} from "src/app/util/router"
  import type {Notification} from "src/engine"

  export let notification: Notification

  const {event: note, interactions, timestamp} = notification
  const likes = interactions.filter(e => e.kind === 7)
  const zaps = interactions.filter(e => e.kind === 9734)

  const goToNote = () =>
    router
      .at("notes")
      .of(note.id, {relays: tracker.getRelays(note.id)})
      .open()

  const actionText = closure(() => {
    if (likes.length === 0) return "zapped"
    if (zaps.length === 0) return "liked"

    return "reacted to"
  })
</script>

<PeopleAction
  pubkeys={uniq(pluck("pubkey", interactions))}
  actionText={`${actionText} your note`} />

<Card interactive class="flex w-full flex-col gap-2 text-left" on:click={goToNote}>
  <div on:click|stopPropagation class="flex justify-between">
    {formatTimestamp(timestamp)}
  </div>
  <div class="break-word overflow-hidden text-neutral-100">
    <NoteContent {note} />
  </div>
</Card>
