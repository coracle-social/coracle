<script lang="ts">
  import {closure} from "hurdak"
  import {pluck, uniq} from "@welshman/lib"
  import {pubkey, tracker} from "@welshman/app"
  import {formatTimestamp} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"
  import {router} from "src/app/util/router"
  import type {Notification} from "src/engine"
  import {deriveEvent} from "src/engine"

  export let notification: Notification

  const {root, interactions} = notification
  const event = deriveEvent(root)
  const likes = interactions.filter(e => e.kind === 7)
  const zaps = interactions.filter(e => e.kind === 9734)

  const goToNote = () =>
    router
      .at("notes")
      .of(root, {relays: tracker.getRelays(root)})
      .open()

  const actionText = closure(() => {
    if (likes.length === 0) return "zapped"
    if (zaps.length === 0) return "liked"

    return "reacted to"
  })
</script>

{#if $event?.pubkey === $pubkey}
  <div class="my-4 flex flex-col gap-4">
    <PeopleAction
      pubkeys={uniq(pluck("pubkey", interactions))}
      actionText={`${actionText} your note`} />
    <Card interactive class="flex w-full flex-col gap-2 text-left" on:click={goToNote}>
      <button type="button" on:click|stopPropagation class="flex justify-between text-sm">
        {formatTimestamp($event.created_at)}
      </button>
      <div class="break-word overflow-hidden text-neutral-100">
        <NoteContent note={$event} />
      </div>
    </Card>
  </div>
{/if}
