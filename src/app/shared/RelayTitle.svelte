<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {stringToHue, hsl} from "src/util/misc"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"

  export let url
</script>

<div class="flex items-center gap-2 text-xl">
  <i class={url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
  <span class="border-b border-solid" style={`border-color: ${hsl(stringToHue(url))}`}>
    {displayRelayUrl(url)}
  </span>
  <RelayStatus {url} />
</div>
