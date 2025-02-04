<script lang="ts">
  import {preventDefault} from "svelte/legacy"

  import {displayUrl} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import ContentLinkDetail from "@app/components/ContentLinkDetail.svelte"
  import {pushModal} from "@app/modal"

  let {value} = $props()

  const url = value.url.toString()

  const expand = () => pushModal(ContentLinkDetail, {url}, {fullscreen: true})
</script>

{#if url.match(/\.(jpe?g|png|gif|webp)$/)}
  <!-- Use a real link so people can copy the href -->
  <a href={url} class="link-content whitespace-nowrap" onclick={preventDefault(expand)}>
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(url)}
  </a>
{:else}
  <Link external href={url} class="link-content whitespace-nowrap">
    <Icon icon="link-round" size={3} class="inline-block" />
    {displayUrl(url)}
  </Link>
{/if}
