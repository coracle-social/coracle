<script type="ts">
  import {onMount} from "svelte"
  import {uniq, sortBy, pluck} from "ramda"
  import {Tags} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import {watch} from "src/agent/db"
  import network from "src/agent/network"

  export let type
  export let pubkey

  let pubkeys = []

  const person = getPersonWithFallback(pubkey)
  const people = watch("people", t => {
    return sortBy(p => (p.kind0 ? 0 : 1), pubkeys.map(getPersonWithFallback))
  })

  onMount(async () => {
    if (type === "follows") {
      pubkeys = Tags.wrap(person.petnames).values().all()
      people.refresh()
    } else {
      await network.load({
        shouldProcess: false,
        relays: sampleRelays(getPubkeyWriteRelays(pubkey)),
        filter: [{kinds: [3], "#p": [pubkey]}],
        onChunk: events => {
          pubkeys = uniq(pubkeys.concat(pluck("pubkey", events)))
          people.refresh()
        },
      })
    }

    network.loadPeople(pubkeys)
  })
</script>

<Content gap={2}>
  {#each $people || [] as person}
    <PersonInfo {person} />
  {:else}
    <Spinner />
  {/each}
</Content>
