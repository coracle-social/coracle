<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import {displayUrl} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"

  const {url, children} = $props()

  const relay = deriveRelay(url)

  const connections = $derived($relay?.stats?.open_count || 0)
</script>

<div class="card2 card2-sm bg-alt column gap-2">
  <div class="flex items-center justify-between gap-4">
    <div class="ellipsize flex items-center gap-2">
      <Icon icon="server" />
      <p class="ellipsize">{displayRelayUrl(url)}</p>
    </div>
    {@render children?.()}
  </div>
  {#if $relay?.profile?.description}
    <p class="ellipsize">{$relay?.profile.description}</p>
  {/if}
  <span class="flex items-center gap-1 whitespace-nowrap text-sm">
    {#if $relay?.profile?.contact}
      <Link external class="ellipsize underline" href={$relay.profile.contact}
        >{displayUrl($relay.profile.contact)}</Link>
      &bull;
    {/if}
    {#if $relay?.profile?.supported_nips}
      <span
        class="tooltip cursor-pointer underline"
        data-tip="NIPs supported: {$relay.profile.supported_nips.join(', ')}">
        {$relay.profile.supported_nips.length} NIPs
      </span>
      &bull;
    {/if}
    Connected {connections}
    {connections === 1 ? "time" : "times"}
  </span>
</div>
