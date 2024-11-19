<script lang="ts">
  import type {Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {LOCAL_RELAY_URL} from "@welshman/util"
  import Anchor from "src/partials/Anchor.svelte"

  export let thunk: Thunk

  $: status = thunk.status
  $: relays = thunk.request.relays.filter(r => r != LOCAL_RELAY_URL)
  $: statuses = Object.entries($status || {})
    .filter(([k, v]) => k !== LOCAL_RELAY_URL)
    .map(([k, v]) => v)
  $: total = relays.length
  $: pending = statuses.filter(s => s.status === PublishStatus.Pending).length
</script>

<div>
  Published to {total - pending}/{total} relays.
  <Anchor modal underline href="/publishes">View details</Anchor>
</div>
