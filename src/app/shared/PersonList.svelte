<script type="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "src/util/misc"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {social, settings, routing, network} from "src/system"
  import legacyNetwork from "src/agent/network"

  export let type
  export let pubkey

  let pubkeys = []

  onMount(async () => {
    if (type === "follows") {
      pubkeys = social.getFollows(pubkey)
    } else {
      await network.load({
        shouldProcess: false,
        relays: routing.getPubkeyHints(settings.getSetting("relayLimit"), pubkey, "read"),
        filter: {kinds: [3], "#p": [pubkey]},
        onEvent: batch(500, events => {
          const newPubkeys = pluck("pubkey", events)

          legacyNetwork.loadPeople(newPubkeys)

          pubkeys = uniq(pubkeys.concat(newPubkeys))
        }),
      })
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
