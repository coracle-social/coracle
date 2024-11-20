<script lang="ts">
  import {nip19} from "nostr-tools"
  import {goto} from "$app/navigation"
  import {ctx, nthEq} from "@welshman/lib"
  import {Address, DIRECT_MESSAGE} from "@welshman/util"
  import {repository} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import ChannelConversation from "@app/components/ChannelConversation.svelte"
  import {deriveEvent, entityLink, MESSAGE, THREAD} from "@app/state"
  import {makeThreadPath} from "@app/routes"
  import {pushDrawer} from "@app/modal"

  export let value
  export let event
  export let depth = 0

  const {id, identifier, kind, pubkey, relays: relayHints = []} = value
  const addr = new Address(kind, pubkey, identifier)
  const idOrAddress = id || addr.toString()
  const relays = ctx.app.router.Quote(event, idOrAddress, relayHints).getUrls()
  const quote = deriveEvent(idOrAddress, relays)
  const entity = id ? nip19.neventEncode({id, relays}) : addr.toNaddr()

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
      return pushDrawer(ChannelConversation, {url, room, event})
    }

    return Boolean(event)
  }

  const onClick = (e: Event) => {
    if ($quote) {
      if ($quote.kind === DIRECT_MESSAGE) {
        return scrollToEvent($quote.id)
      }

      const [room, url] = $quote.tags.find(nthEq(0, "~"))?.slice(1) || []

      if (url && room) {
        if ($quote.kind === THREAD) {
          return goto(makeThreadPath(url, $quote.id))
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

          if (parseInt(kind) === MESSAGE) {
            return scrollToEvent(id) || openMessage(url, room, id)
          }
        }
      }
    }

    window.open(entityLink(entity))
  }
</script>

<Button class="my-2 block max-w-full text-left" on:click={onClick}>
  {#if $quote}
    <NoteCard event={$quote} class="bg-alt rounded-box p-4">
      <slot name="note-content" event={$quote} {depth} />
    </NoteCard>
  {:else}
    <div class="rounded-box p-4">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</Button>
