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

  export let note
  export let value

  const openPerson = pubkey => modal.push({type: "person/feed", pubkey})

  const loadQuote = async () => {
    const {id, relays} = value

    try {
      const [event] = await network.load({
        relays: sampleRelays(
          (relays || []).map(objOf("url")).concat(Tags.from(note).equals(id).relays())
        ),
        filter: [{ids: [id]}],
      })

      return event || Promise.reject()
    } catch (e) {
      warn(e)
    }
  }

  const openQuote = () => {
    modal.push({type: "note/detail", note: {id: value.id}})
  }
</script>

<div class="py-2">
  <Card interactive invertColors class="my-2" on:click={openQuote}>
    {#await loadQuote()}
      <Spinner />
    {:then quote}
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
    {:catch}
      <p class="mb-1 py-24 text-center text-gray-5" in:fly={{y: 20}}>
        Unable to load a preview for quoted event
      </p>
    {/await}
  </Card>
</div>
