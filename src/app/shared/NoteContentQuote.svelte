<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {getAddress, Address} from "@welshman/util"
  import {deriveProfileDisplay} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
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
  const relays = ctx.app.router
    .merge([
      ctx.app.router.fromRelays(relayHints),
      ctx.app.router.EventMentions(note),
      ctx.app.router.ForPubkeys([note.pubkey]),
    ])
    .getUrls()

  const quote = deriveEvent(idOrAddress, {relays, forcePlatform: false})

  const openQuote = e => {
    const noteId = value.id || $quote?.id

    // stopPropagation wasn't working for some reason
    if (e.detail.target.textContent === "Show") {
      return
    }

    if (isGroup) {
      router.at("groups").of(address, {relays}).at("notes").open()
    } else if (noteId) {
      router.at("notes").of(noteId, {relays}).open()
    }
  }

  const unmute = e => {
    showHidden = true
  }

  $: address = $quote ? getAddress($quote) : ""
  $: isGroup = address.match(/^(34550|35834):/)
  $: profileDisplay = deriveProfileDisplay($quote?.pubkey)
  $: muted = $quote && $isEventMuted($quote, true)
</script>

<div class="my-2" on:click|stopPropagation>
  <Card interactive stopPropagation class="my-2" on:click={openQuote}>
    {#if muted && !showHidden}
      <p class="mb-1 py-24 text-center text-neutral-600">
        You have hidden this note.
        <Anchor underline stopPropagation on:click={unmute}>Show</Anchor>
      </p>
    {:else if $quote}
      {#if !isGroup}
        <div class="mb-4 flex items-center gap-4">
          <PersonCircle class="h-6 w-6" pubkey={$quote.pubkey} />
          <Anchor
            modal
            stopPropagation
            type="unstyled"
            class="flex items-center gap-2"
            href={router.at("people").of($quote.pubkey).toString()}>
            <h2 class="text-lg">{$profileDisplay}</h2>
          </Anchor>
        </div>
      {/if}
      <slot name="note-content" quote={$quote} {depth} />
    {:else}
      <div class="px-20">
        <Spinner />
      </div>
    {/if}
  </Card>
</div>
