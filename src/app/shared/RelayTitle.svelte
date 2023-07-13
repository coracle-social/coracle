<script lang="ts">
  import {onMount} from "svelte"
  import {between} from "hurdak/lib/hurdak"
  import {webSocketURLToPlainOrBase64} from "src/util/misc"
  import {poll, stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {nip65, meta} from "src/app/engine"

  export let relay
  export let rating = null

  let quality = null
  let message = null
  let showStatus = false

  onMount(() => {
    return poll(10_000, () => {
      ;[quality, message] = meta.getRelayQuality(relay.url)
    })
  })
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={relay.url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <Anchor
    type="unstyled"
    href={`/relays/${webSocketURLToPlainOrBase64(relay.url)}`}
    class="border-b border-solid"
    style={`border-color: ${hsl(stringToHue(relay.url))}`}>
    {nip65.displayRelay(relay)}
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
  {#if rating}
    <div class="px-4 text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
</div>
