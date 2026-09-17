<script lang="ts">
  import {isShareableRelayUrl} from "@welshman/util"
  import MediaGrid from "src/app/shared/MediaGrid.svelte"
  import MediaLink from "src/app/shared/MediaLink.svelte"
  import {router} from "src/app/util/router"
  import {stripTrackers} from "src/util/misc"

  export let urls: string[]
  export let showMedia = false
  export let note = undefined

  const coracleRegexp = /^(https?:\/\/)?(app\.)?coracle.social/

  // Avoid leaking referrer data to trackers when people follow content links
  $: cleanUrls = urls.map(stripTrackers)

  const onLinkClick = (url: string, event: PointerEvent) => {
    if (event.metaKey) {
      return window.open(url, "_blank")
    }

    if (url.match(coracleRegexp)) {
      router.at(url.replace(coracleRegexp, "")).open()
    } else if (isShareableRelayUrl(url)) {
      router.at("relays").of(url).open()
    } else if (!showMedia) {
      router.at("media").of(url).cx({urls: cleanUrls, note}).open({overlay: true})
    } else {
      window.open(url, "_blank")
    }
  }

  const onImageClick = (url: string, event: PointerEvent) => {
    if (event.metaKey) {
      return window.open(url, "_blank")
    }

    router.at("media").of(url).cx({urls, note}).open({overlay: true})
  }

  const onClick = (url: string, event: PointerEvent) => {
    if (url.match(/\.(jpe?g|png|gif|webp)$/)) {
      onImageClick(url, event)
    } else {
      onLinkClick(url, event)
    }
  }

  const onClose = () => {
    hidden = true
  }

  let hidden = false
</script>

{#if showMedia && !hidden}
  <MediaGrid urls={cleanUrls} {note} {onClose} {onLinkClick} {onImageClick} />
{:else}
  {#each cleanUrls as url}
    <MediaLink {url} {onClick} />
  {/each}
{/if}
