<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"

  export let url
  export let rating = null
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <span class="border-b border-solid" style={`border-color: ${hsl(stringToHue(url))}`}>
    {displayRelayUrl(url)}
  </span>
  <RelayStatus {url} />
  {#if rating}
    <div class="px-4 text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
</div>
