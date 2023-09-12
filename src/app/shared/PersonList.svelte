<script type="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {loadPubkeys} from "src/engine2"
  import {getSetting, getPubkeyHints, follows} from "src/engine2"
  import {Network} from "src/app/engine"

  export let type
  export let pubkey

  let pubkeys = []

  onMount(() => {
    if (type === "follows") {
      pubkeys = $follows
    } else {
      const sub = Network.subscribe({
        relays: getPubkeyHints(getSetting("relay_limit"), pubkey, "read"),
        filter: {kinds: [3], "#p": [pubkey]},
        onEvent: batch(500, events => {
          const newPubkeys = pluck("pubkey", events)

          loadPubkeys(newPubkeys)

          pubkeys = uniq(pubkeys.concat(newPubkeys))
        }),
      })

      return sub.close
    }
  })
</script>

<Content gap="gap-2">
  {#each pubkeys as pubkey (pubkey)}
    <PersonSummary {pubkey} />
  {:else}
    <Spinner />
  {/each}
</Content>
