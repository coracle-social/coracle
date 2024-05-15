<script lang="ts">
  import {onMount} from "svelte"
  import {getAddress, getIdFilters} from "@welshman/util"
  import {filterVals} from "hurdak"
  import {asArray} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"
  import {hints, loadOne, loadPubkeys, displayPubkey, isEventMuted} from "src/engine"

  export let note
  export let value

  let quote
  let muted = false
  let loading = true

  const {id, identifier, kind, pubkey, relays: relayHints = []} = value

  const relays = hints
    .merge([
      hints.fromRelays(relayHints),
      hints.EventMentions(note),
      hints.ForPubkeys([note.pubkey]),
    ])
    .getUrls()

  const openQuote = e => {
    const noteId = value.id || quote?.id

    // stopPropagation wasn't working for some reason
    if (e.detail.target.textContent === "Show") {
      return
    }

    if (isGroup) {
      router.at("groups").of(address, {relays}).at("notes").open()
    } else if (noteId) {
      router
        .at("notes")
        .of(noteId, {relays})
        .cx({context: asArray(quote)})
        .open()
    }
  }

  const unmute = e => {
    muted = false
  }

  $: address = quote ? getAddress(quote) : ""
  $: isGroup = address.match(/^(34550|35834):/)

  onMount(async () => {
    quote = await loadOne({
      relays: relays,
      filters: id
        ? getIdFilters([id])
        : [
            filterVals(xs => xs.length > 0, {
              "#d": [identifier],
              kinds: [kind],
              authors: [pubkey],
            }),
          ],
    })

    if (quote) {
      loading = false
      muted = $isEventMuted(quote, true)
      loadPubkeys([quote.pubkey])
    }
  })
</script>

<div class="py-2" on:click|stopPropagation>
  <Card interactive stopPropagation class="my-2" on:click={openQuote}>
    {#if loading}
      <div class="px-20">
        <Spinner />
      </div>
    {:else if quote}
      {#if muted}
        <p class="mb-1 py-24 text-center text-neutral-600">
          You have hidden this note.
          <Anchor class="underline" on:click={unmute}>Show</Anchor>
        </p>
      {:else}
        {#if !isGroup}
          <div class="mb-4 flex items-center gap-4">
            <PersonCircle class="h-6 w-6" pubkey={quote.pubkey} />
            <Anchor
              modal
              stopPropagation
              type="unstyled"
              class="flex items-center gap-2"
              href={router.at("people").of(quote.pubkey).toString()}>
              <h2 class="text-lg">{displayPubkey(quote.pubkey)}</h2>
            </Anchor>
          </div>
        {/if}
        <slot name="note-content" {quote} />
      {/if}
    {:else}
      <p class="mb-1 py-24 text-center text-neutral-600">
        Unable to load a preview for quoted event
      </p>
    {/if}
  </Card>
</div>
