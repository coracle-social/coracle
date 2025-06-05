<script lang="ts">
  import {AuthStatus, SocketStatus} from "@welshman/net"
  import {deriveSocket} from "@app/state"
  import StatusIndicator from "@lib/components/StatusIndicator.svelte"

  type Props = {
    url: string
  }

  const {url}: Props = $props()
  const socket = deriveSocket(url)
</script>

{#if $socket.status === SocketStatus.Open}
  {#if $socket.auth.status === AuthStatus.None}
    <StatusIndicator class="bg-green-500">Connected</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.Requested}
    <StatusIndicator class="bg-yellow-500">Authenticating</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.PendingSignature}
    <StatusIndicator class="bg-yellow-500">Authenticating</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.DeniedSignature}
    <StatusIndicator class="bg-red-500">Failed to Authenticate</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.PendingResponse}
    <StatusIndicator class="bg-yellow-500">Authenticating</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.Forbidden}
    <StatusIndicator class="bg-red-500">Access Denied</StatusIndicator>
  {:else if $socket.auth.status === AuthStatus.Ok}
    <StatusIndicator class="bg-green-500">Connected</StatusIndicator>
  {/if}
{:else if $socket.status === SocketStatus.Opening}
  <StatusIndicator class="bg-yellow-500">Connecting</StatusIndicator>
{:else if $socket.status === SocketStatus.Closing}
  <StatusIndicator class="bg-gray-500">Not Connected</StatusIndicator>
{:else if $socket.status === SocketStatus.Closed}
  <StatusIndicator class="bg-gray-500">Not Connected</StatusIndicator>
{:else if $socket.status === SocketStatus.Error}
  <StatusIndicator class="bg-red-500">Failed to Connect</StatusIndicator>
{/if}
