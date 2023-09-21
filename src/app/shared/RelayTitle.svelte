<script lang="ts">
  import {webSocketURLToPlainOrBase64} from "src/util/misc"
  import {stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import {getSetting, displayRelay} from "src/engine"

  export let relay
  export let rating = null
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={relay.url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <Anchor
    type="unstyled"
    href={`/relays/${webSocketURLToPlainOrBase64(relay.url)}`}
    class="border-b border-solid"
    style={`border-color: ${hsl(stringToHue(relay.url))}`}>
    {displayRelay(relay)}
  </Anchor>
  {#if !getSetting("multiplextr_url")}
    <RelayStatus {relay} />
  {/if}
  {#if rating}
    <div class="px-4 text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
</div>
