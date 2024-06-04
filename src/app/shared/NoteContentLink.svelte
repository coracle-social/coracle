<script lang="ts">
  import {isShareableRelayUrl} from "@welshman/util"
  import {displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import {router} from "src/app/util/router"

  export let value
  export let showMedia = false

  const url = value.url.toString()

  const close = () => {
    hidden = true
  }

  let hidden = false
</script>

{#if showMedia && value.isMedia && !hidden}
  <div class="py-2">
    <Media url={url} onClose={close} />
  </div>
{:else if value.isMedia}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    externalHref={url}
    href={router.at("media").of(url).toString()}>
    {displayUrl(url)}
  </Anchor>
{:else if isShareableRelayUrl(url)}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={router.at("relays").of(url).toString()}>
    {displayUrl(url)}
  </Anchor>
{:else}
  <Anchor
    external
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={url}>
    {displayUrl(url)}
  </Anchor>
{/if}
