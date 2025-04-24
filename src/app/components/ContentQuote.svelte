<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {goto} from "$app/navigation"
  import {nthEq} from "@welshman/lib"
  import {Router} from "@welshman/router"
  import {tracker, repository} from "@welshman/app"
  import type {TrustedEvent} from "@welshman/util"
  import {Address, DIRECT_MESSAGE, MESSAGE, THREAD, EVENT_TIME} from "@welshman/util"
  import {scrollToEvent} from "@lib/html"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import NoteContent from "@app/components/NoteContent.svelte"
  import {deriveEvent, entityLink, ROOM} from "@app/state"
  import {makeThreadPath, makeCalendarPath, makeRoomPath} from "@app/routes"

  type Props = {
    value: any
    hideMediaAtDepth: number
    event: TrustedEvent
    depth: number
    url?: string
  }

  const {value, event, depth, hideMediaAtDepth, url}: Props = $props()

  const {id, identifier, kind, pubkey, relays = []} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()
  const mergedRelays = Router.get().Quote(event, idOrAddress, relays).getUrls()

  if (url) {
    mergedRelays.push(url)
  }

  const quote = deriveEvent(idOrAddress, mergedRelays)
  const entity = id
    ? nip19.neventEncode({id, relays: mergedRelays})
    : new Address(kind, pubkey, identifier, mergedRelays).toNaddr()

  const openMessage = (url: string, room: string, id: string) => {
    const event = repository.getEvent(id)

    if (event) {
      goto(makeRoomPath(url, room))
      scrollToEvent(id)
    }

    return Boolean(event)
  }

  const onclick = () => {
    if ($quote) {
      if ($quote.kind === DIRECT_MESSAGE) {
        return scrollToEvent($quote.id)
      }

      const [url] = tracker.getRelays($quote.id)
      const room = $quote.tags.find(nthEq(0, ROOM))?.[1]

      if (url && room) {
        if ($quote.kind === THREAD) {
          return goto(makeThreadPath(url, $quote.id))
        }

        if ($quote.kind === EVENT_TIME) {
          return goto(makeCalendarPath(url, $quote.id))
        }

        if ($quote.kind === MESSAGE) {
          return scrollToEvent($quote.id) || openMessage(url, room, $quote.id)
        }

        const kind = $quote.tags.find(nthEq(0, "K"))?.[1]
        const id = $quote.tags.find(nthEq(0, "E"))?.[1]

        if (id && kind) {
          if (parseInt(kind) === THREAD) {
            return goto(makeThreadPath(url, id))
          }

          if (parseInt(kind) === EVENT_TIME) {
            return goto(makeCalendarPath(url, id))
          }

          if (parseInt(kind) === MESSAGE) {
            return scrollToEvent(id) || openMessage(url, room, id)
          }
        }
      }
    }

    window.open(entityLink(entity))
  }
</script>

<Button class="my-2 block max-w-full text-left" {onclick}>
  {#if $quote}
    <NoteCard event={$quote} {url} class="bg-alt rounded-box p-4">
      <NoteContent {hideMediaAtDepth} {url} event={$quote} depth={depth + 1} />
    </NoteCard>
  {:else}
    <div class="rounded-box p-4">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</Button>
