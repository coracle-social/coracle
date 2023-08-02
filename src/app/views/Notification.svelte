<script>
  import {pipe, filter, map, when, identity, pluck, propEq, uniq} from "ramda"
  import {closure, quantify} from "hurdak"
  import {tryJson, formatTimestamp} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import Card from "src/partials/Card.svelte"
  import Popover from "src/partials/Popover.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import NotificationSection from "src/app/views/NotificationSection.svelte"
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
  const note = event.ref || notifications[0]
  const replies = notifications.filter(propEq("kind", 1))
  const likes = notifications.filter(propEq("kind", 7))
  const zaps = notifications.filter(propEq("kind", 9734))
  const pubkeys = uniq(pluck("pubkey", notifications))

  const actionText = closure(() => {
    if (replies.length === notifications.length) return "replied to"
    if (likes.length === notifications.length) return "liked"
    if (zaps.length === notifications.length) return "zapped"

    return "reacted to"
  })
</script>

{#if note}
  <div class="flex flex-col items-end gap-1">
    <Card
      interactive
      class="flex w-full flex-col gap-2 text-left"
      on:click={() => modal.push({type: "note/detail", note})}>
      <div on:click|stopPropagation class="flex justify-between">
        {#if !event.ref}
          <div class="flex items-center gap-2">
            <PersonCircle pubkey={note?.pubkey} />
            <PersonName class="font-bold" pubkey={note?.pubkey} />
            <span>mentioned you.</span>
          </div>
        {:else}
          <Popover>
            <div slot="trigger">
              {quantify(pubkeys.length, "person", "people")}
              {actionText} your note.
            </div>
            <div slot="tooltip" class="flex flex-col gap-4 py-2">
              {#if zaps.length > 0}
                <NotificationSection pubkeys={pluck("pubkey", zaps)}>Zapped by</NotificationSection>
              {/if}
              {#if likes.length > 0}
                <NotificationSection pubkeys={pluck("pubkey", likes)}>Liked by</NotificationSection>
              {/if}
              {#if replies.length > 0}
                <NotificationSection pubkeys={pluck("pubkey", replies)}
                  >Replies</NotificationSection>
              {/if}
            </div>
          </Popover>
        {/if}
        <small>
          {formatTimestamp(event.created_at)}
        </small>
      </div>
      <div class="break-word overflow-hidden text-gray-1">
        <NoteContent maxLength={240} expandable={false} showMedia={false} {note} />
      </div>
    </Card>
  </div>
{/if}
