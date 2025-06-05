<script lang="ts">
  import {deriveRelay} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import SocketStatusIndicator from "@lib/components/SocketStatusIndicator.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"

  interface Props {
    url: string
  }

  const {url}: Props = $props()

  const relay = deriveRelay(url)
  const owner = $derived($relay?.profile?.pubkey)
</script>

<div class="card2 bg-alt flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <h3 class="flex items-center gap-2 text-lg font-semibold">
      <Icon icon="server" />
      Relay Details
    </h3>
    <SocketStatusIndicator {url} />
  </div>
  {#if $relay?.profile}
    {@const {software, version, supported_nips, limitation} = $relay.profile}
    <div class="flex flex-wrap gap-1">
      {#if owner}
        <div class="badge badge-neutral">
          <span class="ellipsize">Administrator: <ProfileLink unstyled pubkey={owner} /></span>
        </div>
      {/if}
      {#if $relay?.profile?.contact}
        <div class="badge badge-neutral">
          <span class="ellipsize">Contact: {$relay.profile.contact}</span>
        </div>
      {/if}
      {#if software}
        <div class="badge badge-neutral">
          <span class="ellipsize">Software: {software}</span>
        </div>
      {/if}
      {#if version}
        <div class="badge badge-neutral">
          <span class="ellipsize">Version: {version}</span>
        </div>
      {/if}
      {#if Array.isArray(supported_nips)}
        <p class="badge badge-neutral">
          <span class="ellipsize">Supported NIPs: {supported_nips.join(", ")}</span>
        </p>
      {/if}
      {#if limitation?.auth_required}
        <p class="badge badge-warning">
          <span class="ellipsize">Auth Required</span>
        </p>
      {/if}
      {#if limitation?.payment_required}
        <p class="badge badge-warning">
          <span class="ellipsize">Payment Required</span>
        </p>
      {/if}
      {#if limitation?.min_pow_difficulty}
        <p class="badge badge-warning">
          <span class="ellipsize">Min PoW: {limitation?.min_pow_difficulty}</span>
        </p>
      {/if}
    </div>
  {/if}
</div>
