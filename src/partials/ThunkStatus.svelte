<script lang="ts">
  import {remove, nthNe, nthEq} from "@welshman/lib"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import Anchor from "src/partials/Anchor.svelte"

  export let thunk: Thunk

  $: relays = remove(LOCAL_RELAY_URL, thunk.options.relays)
  $: pending = Object.entries($thunk.status)
    .filter(nthNe(0, LOCAL_RELAY_URL))
    .filter(nthEq(1, PublishStatus.Pending))
</script>

<div>
  Published to {relays.length - pending.length}/{relays.length} relays.
  <Anchor modal underline href="/publishes">View details</Anchor>
</div>
