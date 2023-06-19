<script lang="ts">
  import {objOf} from "ramda"
  import {fly} from "svelte/transition"
  import {warn} from "src/util/logger"
  import {displayPerson, Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {getPersonWithFallback} from "src/agent/db"
  import {sampleRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import user from "src/agent/user"

  export let note
  export let value

  let muted = false

  const openPerson = pubkey => modal.push({type: "person/feed", pubkey})

  const loadQuote = async () => {
    const {id, relays} = value

    try {
      const events = await network.load({
        relays: sampleRelays(
          (relays || []).map(objOf("url")).concat(Tags.from(note).equals(id).relays())
        ),
        filter: [{ids: [id]}],
      })

      muted = user.applyMutes(events).length === 0

      return events[0] || Promise.reject()
    } catch (e) {
      warn(e)
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
      <Spinner />
    {:then quote}
      {#if muted}
        <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
          You have muted this note.
          <Anchor on:click={unmute}>Show</Anchor>
        </p>
      {:else}
        {@const person = getPersonWithFallback(quote.pubkey)}
        <div class="mb-4 flex items-center gap-4">
          <PersonCircle size={6} {person} />
          <Anchor
            stopPropagation
            type="unstyled"
            class="flex items-center gap-2"
            on:click={() => openPerson(quote.pubkey)}>
            <h2 class="text-lg">{displayPerson(person)}</h2>
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
