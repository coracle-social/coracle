<script lang="ts">
  import {annotateMedia, displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import {router} from 'src/app/router'

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
{:else}
  <Anchor
    modal
    stopPropagation
    class="underline"
    href={value.isMedia ? router.at('media').of(value.url).path : value.url}>
    {displayUrl(value.url)}
  </Anchor>
{/if}
