<script lang="ts">
  import type {Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import Anchor from "src/partials/Anchor.svelte"

  export let thunk: Thunk

  const status = thunk.status
  $: total = thunk.request.relays.length
  $: pending = Object.values($status).filter(s => s.status === PublishStatus.Pending).length
</script>

<div>
  Published to {total - pending}/{total} relays.
  <Anchor modal underline href="/publishes">View details</Anchor>
</div>
