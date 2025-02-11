<script lang="ts">
  import {nip19} from "nostr-tools"
  import {goto} from "$app/navigation"
  import {ctx, nthEq} from "@welshman/lib"
  import {tracker, repository} from "@welshman/app"
  import {Address, DIRECT_MESSAGE, MESSAGE, THREAD, EVENT_TIME} from "@welshman/util"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import NoteContent from "@app/components/NoteContent.svelte"
  import {deriveEvent, entityLink, ROOM} from "@app/state"
  import {makeThreadPath, makeCalendarPath, makeRoomPath} from "@app/routes"

  const {value, event, depth, hideMediaAtDepth, relays = []} = $props()

  const {id, identifier, kind, pubkey, relays: relayHints = []} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()
  const mergedRelays = [
    ...relays,
    ...ctx.app.router.Quote(event, idOrAddress, relayHints).getUrls(),
  ]
  const quote = deriveEvent(idOrAddress, mergedRelays)
  const entity = id
    ? nip19.neventEncode({id, relays: mergedRelays})
    : new Address(kind, pubkey, identifier, mergedRelays).toNaddr()

  const scrollToEvent = (id: string) => {
    const element = document.querySelector(`[data-event="${id}"]`) as any

    if (element) {
      element.scrollIntoView({behavior: "smooth"})
      element.style =
        "filter: brightness(1.5); transition-property: all; transition-duration: 400ms;"

      setTimeout(() => {
        element.style = "transition-property: all; transition-duration: 300ms;"
      }, 800)

      setTimeout(() => {
        element.style = ""
      }, 800 + 400)
    }

    return Boolean(element)
  }

  const openMessage = (url: string, room: string, id: string) => {
    const event = repository.getEvent(id)

    if (event) {
      goto(makeRoomPath(url, room))

      // TODO: if the event doesn't immediately load, this won't work. Scroll up until it's found
      setTimeout(() => scrollToEvent(id), 300)
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
    <NoteCard event={$quote} class="bg-alt rounded-box p-4">
      <NoteContent {hideMediaAtDepth} {relays} event={$quote} depth={depth + 1} />
    </NoteCard>
  {:else}
    <div class="rounded-box p-4">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</Button>
