<script lang="ts">
  import {remove, omit, spec} from "@welshman/lib"
  import type {Publication} from "@welshman/app"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import Link from "src/partials/Link.svelte"

  export let publication: Publication

  $: relays = remove(LOCAL_RELAY_URL, publication.relays)
  $: pending = Object.values(omit([LOCAL_RELAY_URL], $publication.results)).filter(
    spec({status: PublishStatus.Pending}),
  )
</script>

<div>
  Published to {relays.length - pending.length}/{relays.length} relays.
  <Link modal class="underline" href="/publishes">View details</Link>
</div>
