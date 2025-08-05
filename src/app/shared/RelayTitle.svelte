<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {stringToHue, hsl} from "src/util/misc"
  import Rating from "src/partials/Rating.svelte"
  import Link from "src/partials/Link.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import {router} from "src/app/util/router"

  export let url
  export let rating = null
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <Link
    type="unstyled"
    href={router.at("relays").of(url).toString()}
    class="border-b border-solid"
    style={`border-color: ${hsl(stringToHue(url))}`}>
    {displayRelayUrl(url)}
  </Link>
  <RelayStatus {url} />
  {#if rating}
    <div class="px-4 text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
</div>
