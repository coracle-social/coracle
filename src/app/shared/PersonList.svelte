<script type="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {Nip02, Nip65, Settings, Network, pubkeyLoader} from "src/app/engine"

  export let type
  export let pubkey

  let pubkeys = []

  onMount(() => {
    if (type === "follows") {
      pubkeys = Nip02.getFollows(pubkey)
    } else {
      const sub = Network.subscribe({
        relays: Nip65.getPubkeyHints(Settings.getSetting("relay_limit"), pubkey, "read"),
        filter: {kinds: [3], "#p": [pubkey]},
        onEvent: batch(500, events => {
          const newPubkeys = pluck("pubkey", events)

          pubkeyLoader.load(newPubkeys)

          pubkeys = uniq(pubkeys.concat(newPubkeys))
        }),
      })

      return sub.close
    }
  })
</script>

<Content gap="gap-2">
  {#each pubkeys as pubkey}
    <PersonInfo {pubkey} />
  {:else}
    <Spinner />
  {/each}
</Content>
