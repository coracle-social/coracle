<script lang="ts">
  import {onMount} from "svelte"
  import {filterVals} from "hurdak"
  import {asArray} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/router"
  import {
    loadOne,
    loadPubkeys,
    displayPubkey,
    isEventMuted,
    getParentHints,
    isShareableRelay,
    getIdFilters,
    selectHints,
  } from "src/engine"

  export let note
  export let value

  let quote = null
  let muted = false
  let loading = true

  const {id, identifier, kind, pubkey} = value

  // Prioritize hints in relay selection by merging directly instead of with mergeHints
  const hints = (value.relays || []).filter(isShareableRelay)
  const relays = selectHints([...hints, ...getParentHints(note)])

  const openQuote = e => {
    const noteId = id || quote?.id

    // stopPropagation wasn't working for some reason
    if (noteId && e.detail.target.textContent !== "Show") {
      router
        .at("notes")
        .of(noteId)
        .cx({relays, context: asArray(quote)})
        .open()
    }
  }

  const unmute = e => {
    muted = false
  }

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
      muted = $isEventMuted(quote)
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
        <p class="mb-1 py-24 text-center text-gray-5">
          You have muted this note.
          <Anchor class="underline" on:click={unmute}>Show</Anchor>
        </p>
      {:else}
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
        <slot name="note-content" {quote} />
      {/if}
    {:else}
      <p class="mb-1 py-24 text-center text-gray-5">Unable to load a preview for quoted event</p>
    {/if}
  </Card>
</div>
