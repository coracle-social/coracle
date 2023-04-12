<script>
  import {max, pipe, filter, map, when, identity, pluck, propEq, uniq} from "ramda"
  import {closure, quantify} from "hurdak/lib/hurdak"
  import {formatTimestamp, tryJson} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import PersonBadge from "src/app2/shared/PersonBadge.svelte"
  import Card from "src/partials/Card.svelte"
  import Popover from "src/partials/Popover.svelte"
  import NoteContent from "src/app2/shared/NoteContent.svelte"
  import NotificationSection from "src/app2/views/NotificationSection.svelte"
  import {getPersonWithFallback, userEvents} from "src/agent/db"
  import {modal} from "src/partials/state"

  export let event

  // Translate zap confirmations to zap requests
  const modifyZaps = pipe(
    map(
      when(propEq("kind", 9735), e => tryJson(() => JSON.parse(Tags.from(e).asMeta().description)))
    ),
    filter(identity)
  )

  const notifications = modifyZaps(event.notifications)
  const note = event.ref ? userEvents.get(event.ref) : notifications[0]
  const timestamp = pluck("created_at", notifications).reduce(max, 0)
  const replies = notifications.filter(propEq("kind", 1))
  const likes = notifications.filter(propEq("kind", 7))
  const zaps = notifications.filter(propEq("kind", 9734))
  const author = getPersonWithFallback(note?.pubkey)
  const pubkeys = uniq(pluck("pubkey", notifications))

  const actionText = closure(() => {
    if (replies.length === notifications.length) return "replied to"
    if (likes.length === notifications.length) return "liked"
    if (zaps.length === notifications.length) return "zapped"

    return "interacted with"
  })
</script>

{#if note}
  <Card
    interactive
    class="flex flex-col gap-2 text-left"
    on:click={() => modal.set({type: "note/detail", note})}>
    <div class="relative flex w-full items-center justify-between gap-2" on:click|stopPropagation>
      {#if !event.ref}
        <div class="flex items-center gap-2">
          <PersonBadge person={author} /> mentioned you.
        </div>
      {:else}
        <Popover>
          <div slot="trigger">
            {quantify(pubkeys.length, "person", "people")}
            {actionText} your note.
          </div>
          <div slot="tooltip" class="flex flex-col gap-4">
            {#if zaps.length > 0}
              <NotificationSection pubkeys={pluck("pubkey", zaps)}>Zapped by</NotificationSection>
            {/if}
            {#if likes.length > 0}
              <NotificationSection pubkeys={pluck("pubkey", likes)}>Liked by</NotificationSection>
            {/if}
            {#if replies.length > 0}
              <NotificationSection pubkeys={pluck("pubkey", replies)}>Replies</NotificationSection>
            {/if}
          </div>
        </Popover>
      {/if}
      <p class="text-sm text-gray-1">{formatTimestamp(timestamp)}</p>
    </div>
    <div class="break-word ml-6 overflow-hidden text-gray-1">
      <NoteContent maxLength={80} showMedia={false} {note} />
    </div>
  </Card>
{/if}
