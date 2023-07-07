<script lang="ts">
  import {fly} from "src/util/transition"
  import {warn} from "src/util/logger"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {directory, routing, social} from "src/system"
  import network from "src/agent/network"

  export let note
  export let value

  let muted = false

  const openPerson = pubkey => modal.push({type: "person/feed", pubkey})

  const loadQuote = async () => {
    const {id, relays = []} = value

    try {
      const events = await network.load({
        relays: routing.mergeHints(3, [relays, routing.getEventHints(3, note)]),
        filter: [{ids: [id]}],
      })

      muted = social.applyMutes(events).length === 0

      return events[0] || Promise.reject()
    } catch (e) {
      warn(e)

      return Promise.reject()
    }
  }

  const openQuote = e => {
    // stopPropagation wasn't working for some reason
    if (e.target.textContent !== "Show") {
      modal.push({type: "note/detail", note: {id: value.id}})
    }
  }

  const unmute = e => {
    muted = false
  }
</script>

<div class="py-2">
  <Card interactive invertColors class="my-2" on:click={openQuote}>
    {#await loadQuote()}
      <div class="px-20">
        <Spinner />
      </div>
    {:then quote}
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
    {:catch}
      <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
        Unable to load a preview for quoted event
      </p>
    {/await}
  </Card>
</div>
