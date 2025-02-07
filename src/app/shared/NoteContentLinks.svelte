<script lang="ts">
  import {isShareableRelayUrl} from "@welshman/util"
  import MediaGrid from "src/app/shared/MediaGrid.svelte"
  import MediaLink from "src/app/shared/MediaLink.svelte"
  import {router} from "src/app/util/router"

  export let urls: string[]
  export let external = false
  export let showMedia = false

  const coracleRegexp = /^(https?:\/\/)?(app\.)?coracle.social/

  const onClick = (url: string, event: PointerEvent) => {
    if (external || event.metaKey) {
      return window.open(url, "_blank")
    }

    if (url.match(coracleRegexp)) {
      router.at(url.replace(coracleRegexp, "")).open()
    } else if (isShareableRelayUrl(url)) {
      router.at("relays").of(url).open()
    } else {
      router.at("media").of(url).cx({urls}).open({overlay: true})
    }
  }

  const onClose = () => {
    hidden = true
  }

  let hidden = false
</script>

{#if showMedia && !hidden}
  <MediaGrid {urls} {onClose} {onClick} />
{:else}
  {#each urls as url}
    <MediaLink {url} {onClick} />
  {/each}
{/if}
