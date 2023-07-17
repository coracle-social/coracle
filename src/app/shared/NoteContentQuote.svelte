<script lang="ts">
  import {onDestroy} from "svelte"
  import {fly} from "src/util/transition"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {directory, nip65, user, network} from "src/app/engine"

  export let note
  export let value

  let quote = null
  let muted = false
  let loading = true

  const openPerson = pubkey => modal.push({type: "person/feed", pubkey})

  const {id, relays = []} = value

  const sub = network.subscribe({
    timeout: 5000,
    relays: nip65.mergeHints(3, [relays, nip65.getEventHints(3, note)]),
    filter: [{ids: [id]}],
    onEvent: event => {
      loading = false
      muted = user.applyMutes([event]).length === 0
      quote = event
    },
  })

  const openQuote = e => {
    // stopPropagation wasn't working for some reason
    if (e.target.textContent !== "Show") {
      modal.push({type: "note/detail", note: {id: value.id}})
    }
  }

  const unmute = e => {
    muted = false
  }

  onDestroy(() => {
    sub.close()
  })
</script>

<div class="py-2">
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
            <h2 class="text-lg">{directory.displayPubkey(quote.pubkey)}</h2>
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
