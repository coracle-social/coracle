<script lang="ts">
  import {displayUrl} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import ContentLinkDetail from "@app/components/ContentLinkDetail.svelte"
  import {pushModal} from "@app/modal"

  export let value

  const url = value.url.toString()

  const expand = () => pushModal(ContentLinkDetail, {url}, {fullscreen: true})
</script>

{#if url.match(/\.(jpe?g|png|gif|webp)$/)}
  <Button class="link-content" on:click={expand}>
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(url)}
  </Button>
{:else}
  <Link external href={url} class="link-content">
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(url)}
  </Link>
{/if}
