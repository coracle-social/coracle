<script lang="ts">
  import {stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import {router} from "src/app/router"
  import {getSetting, displayRelay} from "src/engine"

  export let relay
  export let rating = null
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={relay.url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <Anchor
    type="unstyled"
    href={router.at("relays").of(relay.url).path}
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
