<script lang="ts">
  import {noop, uniq} from "@welshman/lib"
  import {
    Address,
    inbox,
    isShareableRelayUrl,
    outbox,
    relay,
    relays as relaySelections,
  } from "@welshman/util"
  import {headerlessKinds} from "src/util/nostr"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {getWriteRelays, profiles, relayLists, resolveRelays} from "src/engine/core"
  import {router} from "src/app/util/router"
  import {isEventMuted, deriveEvent} from "src/engine"

  export let note
  export let value
  export let depth = 0

  let showHidden = false

  const {id, identifier, kind, pubkey, relays: relayHints = []} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()

  const tag = note.tags.find(t => t[1] === idOrAddress)
  const selections = [
    ...relaySelections(relayHints),
    inbox(note.pubkey),
    outbox(note.pubkey),
    ...(isShareableRelayUrl(tag?.[2] || "") ? [relay(tag[2])] : []),
    ...(tag?.[3]?.length === 64 ? [outbox(tag[3])] : []),
  ]

  let relays = uniq([
    ...relayHints,
    ...relayLists.get().readUrls(note.pubkey).get(),
    ...getWriteRelays(note.pubkey),
  ])

  const quote = deriveEvent(idOrAddress, {relays})

  resolveRelays(selections)
    .then(urls => {
      relays = uniq([...relays, ...urls])
    })
    .catch(noop)

  const openQuote = e => {
    const noteId = value.id || $quote?.id

    // stopPropagation wasn't working for some reason
    if (e.detail.target.textContent === "Show") {
      return
    }

    if (noteId) {
      router.at("notes").of(noteId, {relays}).open()
    }
  }

  const unmute = e => {
    showHidden = true
  }

  $: profileDisplay = $profiles.display($quote?.pubkey).$
  $: muted = $quote && $isEventMuted($quote, true)
</script>

<Card interactive stopPropagation class="my-2" on:click={openQuote}>
  {#if muted && !showHidden}
    <p class="mb-1 py-24 text-center text-neutral-600">
      You have hidden this note.
      <Button class="underline" stopPropagation on:click={unmute}>Show</Button>
    </p>
  {:else if $quote}
    {#if !headerlessKinds.includes($quote.kind)}
      <div class="mb-4 flex items-center gap-4">
        <PersonCircle class="h-6 w-6" pubkey={$quote.pubkey} />
        <Link
          modal
          stopPropagation
          type="unstyled"
          class="flex items-center gap-2"
          href={router.at("people").of($quote.pubkey).toString()}>
          <h2 class="text-lg">{$profileDisplay}</h2>
        </Link>
      </div>
    {/if}
    <slot name="note-content" quote={$quote} {depth} />
  {:else}
    <div class="px-20">
      <Spinner />
    </div>
  {/if}
</Card>
