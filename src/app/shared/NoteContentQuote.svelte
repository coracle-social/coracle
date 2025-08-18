<script lang="ts">
  import {Address} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {deriveProfileDisplay} from "@welshman/app"
  import {headerlessKinds} from "src/util/nostr"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"
  import {isEventMuted, deriveEvent} from "src/engine"

  export let note
  export let value
  export let depth = 0

  let showHidden = false

  const {id, identifier, kind, pubkey, relays: relayHints = []} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()
  const relays = Router.get()
    .Quote(note, idOrAddress, relayHints)
    .policy(addMaximalFallbacks)
    .getUrls()
  const quote = deriveEvent(idOrAddress, {relays})

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

  $: profileDisplay = deriveProfileDisplay($quote?.pubkey)
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
