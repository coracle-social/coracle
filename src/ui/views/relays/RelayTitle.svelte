<script lang="ts">
  import {onMount} from "svelte"
  import {between} from "hurdak/lib/hurdak"
  import {displayRelay} from "src/util/nostr"
  import {poll, stringToHue, hsl} from "src/util/misc"
  import Anchor from "src/ui/partials/Anchor.svelte"
  import pool from "src/agent/pool"

  export let relay

  let quality = null
  let message = null
  let showStatus = false

  onMount(() => {
    return poll(10_000, async () => {
      ;[quality, message] = pool.getQuality(relay.url)
    })
  })
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={relay.url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <Anchor
    type="unstyled"
    href={`/relays/${btoa(relay.url)}`}
    class="border-b border-solid"
    style={`border-color: ${hsl(stringToHue(relay.url))}`}>
    {displayRelay(relay)}
  </Anchor>
  <span
    on:mouseout={() => {
      showStatus = false
    }}
    on:mouseover={() => {
      showStatus = true
    }}
    class="h-2 w-2 cursor-pointer rounded-full bg-gray-6"
    class:bg-gray-6={message === "Not connected"}
    class:bg-danger={quality <= 0.3 && message !== "Not connected"}
    class:bg-warning={between(0.3, 0.7, quality)}
    class:bg-success={quality > 0.7} />
  <p
    class="hidden text-sm text-gray-1 transition-all sm:block"
    class:opacity-0={!showStatus}
    class:opacity-1={showStatus}>
    {message}
  </p>
</div>
