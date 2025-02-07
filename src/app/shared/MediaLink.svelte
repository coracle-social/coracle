<script lang="ts">
  import {isShareableRelayUrl} from "@welshman/util"
  import {displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"

  export let url: string

  const coracleRegexp = /^(https?:\/\/)?(app\.)?coracle.social/

  const onClick = () => {
    if (url.match(coracleRegexp)) {
      router.at(url.replace(coracleRegexp, "")).push({overlay: true})
    } else if (isShareableRelayUrl(url)) {
      router.at("relays").of(url).push({overlay: true})
    } else {
      router.at("media").of(url).push({overlay: true})
    }
  }
</script>

<Anchor
  underline
  stopPropagation
  class="overflow-hidden text-ellipsis whitespace-nowrap underline"
  externalHref={url}
  on:click={onClick}>
  {displayUrl(url)}
</Anchor>
