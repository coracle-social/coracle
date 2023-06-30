<script type="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {social} from "src/system"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import network from "src/agent/network"

  export let type
  export let pubkey

  let pubkeys = []

  onMount(async () => {
    if (type === "follows") {
      pubkeys = social.getFollows(pubkey)
    } else {
      await network.load({
        shouldProcess: false,
        relays: sampleRelays(getPubkeyWriteRelays(pubkey)),
        filter: [{kinds: [3], "#p": [pubkey]}],
        onChunk: events => {
          pubkeys = uniq(pubkeys.concat(pluck("pubkey", events)))
        },
      })
    }

    network.loadPeople(pubkeys)
  })
</script>

<Content gap="gap-2">
  {#each pubkeys as pubkey}
    <PersonInfo {pubkey} />
  {:else}
    <Spinner />
  {/each}
</Content>
