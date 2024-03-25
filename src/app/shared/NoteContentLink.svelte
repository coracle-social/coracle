<script lang="ts">
  import {isShareableRelayUrl} from "@coracle.social/util"
  import {displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import {router} from "src/app/router"

  export let value
  export let showMedia = false

  const close = () => {
    hidden = true
  }

  const getUrlWithHash = () => {
    let url = value.url

    if (value.hash) {
      url += `#${value.hash}`
    }

    return url
  }

  let hidden = false
</script>

{#if showMedia && value.isMedia && !hidden}
  <div class="py-2">
    <Media url={value.url} onClose={close} />
  </div>
{:else if value.isMedia}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    externalHref={value.url}
    href={router.at("media").of(value.url).toString()}>
    {displayUrl(value.url)}
  </Anchor>
{:else if isShareableRelayUrl(value.url)}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={router.at("relays").of(getUrlWithHash()).toString()}>
    {displayUrl(value.url)}
  </Anchor>
{:else}
  <Anchor
    external
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={getUrlWithHash()}>
    {displayUrl(value.url)}
  </Anchor>
{/if}
