<script lang="ts">
  import {remove, omit, spec} from "@welshman/lib"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import Link from "src/partials/Link.svelte"

  export let thunk: Thunk

  $: relays = remove(LOCAL_RELAY_URL, thunk.options.relays)
  $: pending = Object.values(omit([LOCAL_RELAY_URL], $thunk.results)).filter(
    spec({status: PublishStatus.Pending}),
  )
</script>

<div>
  Published to {relays.length - pending.length}/{relays.length} relays.
  <Link modal class="underline" href="/publishes">View details</Link>
</div>
