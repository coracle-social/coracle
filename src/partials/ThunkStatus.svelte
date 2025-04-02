<script lang="ts">
  import {ne, omit} from "@welshman/lib"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {LOCAL_RELAY_URL} from "@welshman/relay"
  import Anchor from "src/partials/Anchor.svelte"

  export let thunk: Thunk

  $: status = thunk.status
  $: relays = thunk.request.relays.filter(ne(LOCAL_RELAY_URL))
  $: statuses = Object.values(omit([LOCAL_RELAY_URL], $status || {}))
  $: total = relays.length
  $: pending = statuses.filter(s => s.status === PublishStatus.Pending).length
</script>

<div>
  Published to {total - pending}/{total} relays.
  <Anchor modal underline href="/publishes">View details</Anchor>
</div>
