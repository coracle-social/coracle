<script lang="ts">
  import type {Filter} from "nostr-tools"
  import {onDestroy} from "svelte"
  import {filterVals} from "hurdak"
  import {fly} from "src/util/transition"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {Directory, Nip65, user, Network} from "src/app/engine"

  export let note
  export let value

  let quote = null
  let muted = false
  let loading = true

  const openPerson = pubkey => modal.push({type: "person/detail", pubkey})

  const {id, identifier, kind, pubkey, relays = []} = value

  const sub = Network.subscribe({
    timeout: 5000,
    relays: Nip65.mergeHints(3, [relays, Nip65.getEventHints(3, note)]),
    filter: (id
      ? {ids: [id]}
      : filterVals(xs => xs.length > 0, {
          "#d": [identifier],
          kinds: [kind],
          authors: [pubkey],
        })) as Filter,
    onEvent: event => {
      loading = false
      muted = user.applyMutes([event]).length === 0
      quote = event
    },
  })

  const openQuote = e => {
    const noteId = id || quote?.id

    // stopPropagation wasn't working for some reason
    if (noteId && e.target.textContent !== "Show") {
      modal.push({type: "note/detail", note: {id: noteId}})
    }
  }

  const unmute = e => {
    muted = false
  }

  onDestroy(() => {
    sub.close()
  })
</script>

<div class="py-2" on:click|stopPropagation>
  <Card interactive invertColors class="my-2" on:click={openQuote}>
    {#if loading}
      <div class="px-20">
        <Spinner />
      </div>
    {:else if quote}
      {#if muted}
        <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
          You have muted this note.
          <Anchor class="underline" on:click={unmute}>Show</Anchor>
        </p>
      {:else}
        <div class="mb-4 flex items-center gap-4">
          <PersonCircle size={6} pubkey={quote.pubkey} />
          <Anchor
            stopPropagation
            type="unstyled"
            class="flex items-center gap-2"
            on:click={() => openPerson(quote.pubkey)}>
            <h2 class="text-lg">{Directory.displayPubkey(quote.pubkey)}</h2>
          </Anchor>
        </div>
        <slot name="note-content" {quote} />
      {/if}
    {:else}
      <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
        Unable to load a preview for quoted event
      </p>
    {/if}
  </Card>
</div>
