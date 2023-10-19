<script lang="ts">
  import {annotateMedia, displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import {isShareableRelay} from "src/engine"
  import {router} from "src/app/router"

  export let value
  export let showMedia

  const close = () => {
    hidden = true
  }

  let hidden = false
</script>

{#if showMedia && value.isMedia && !hidden}
  <div class="py-2">
    <Media link={annotateMedia(value.url)} onClose={close} />
  </div>
{:else if value.isMedia}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={router.at("media").of(value.url).toString()}>
    {displayUrl(value.url)}
  </Anchor>
{:else if isShareableRelay(value.url)}
  <Anchor
    modal
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={router.at("relays").of(value.url).toString()}>
    {displayUrl(value.url)}
  </Anchor>
{:else}
  <Anchor
    external
    stopPropagation
    class="overflow-hidden text-ellipsis whitespace-nowrap underline"
    href={value.url}>
    {displayUrl(value.url)}
  </Anchor>
{/if}
