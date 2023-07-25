<script lang="ts">
  import {onMount} from "svelte"
  import {between, poll} from "hurdak"
  import {webSocketURLToPlainOrBase64} from "src/util/misc"
  import {stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {Nip65, Network} from "src/app/engine"

  export let relay
  export let rating = null

  let meta = null
  let showStatus = false

  onMount(() => {
    return poll(10_000, () => {
      const socket = Network.pool.get(relay.url, {autoConnect: false})

      meta = socket?.meta
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
    {Nip65.displayRelay(relay)}
  </Anchor>
  <span
    on:mouseout={() => {
      showStatus = false
    }}
    on:mouseover={() => {
      showStatus = true
    }}
    class="h-2 w-2 cursor-pointer rounded-full bg-gray-6"
    class:bg-gray-6={!meta}
    class:bg-danger={meta && meta.quality <= 0.3}
    class:bg-warning={meta && between(0.3, 0.7, meta.quality)}
    class:bg-success={meta && meta.quality > 0.7} />
  <p
    class="hidden text-sm text-gray-1 transition-all sm:block"
    class:opacity-0={!showStatus}
    class:opacity-1={showStatus}>
    {meta ? meta.description : "Not connected"}
  </p>
  {#if rating}
    <div class="px-4 text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
</div>
