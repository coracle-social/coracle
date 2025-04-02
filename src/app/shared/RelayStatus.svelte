<script lang="ts">
  import {onMount} from "svelte"
  import {Pool} from "@welshman/net"
  import Popover from "src/partials/Popover.svelte"
  import {ConnectionType, displayConnectionType, getSocketStatus} from "src/domain/connection"

  export let url

  let status = ConnectionType.NotConnected

  onMount(() => {
    const interval = setInterval(() => {
      status = getSocketStatus(Pool.getSingleton().get(url))
    }, 800)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<Popover triggerType="mouseenter">
  <div
    slot="trigger"
    class="h-2 w-2 cursor-pointer rounded-full bg-neutral-600"
    class:bg-neutral-600={ConnectionType.NotConnected === status}
    class:bg-danger={[ConnectionType.LoginFailed, ConnectionType.ConnectFailed].includes(status)}
    class:bg-success={ConnectionType.Connected === status}
    class:bg-warning={[
      ConnectionType.Logging,
      ConnectionType.WaitReconnect,
      ConnectionType.UnstableConnection,
    ].includes(status)} />
  <div slot="tooltip" class="transition-all sm:block">
    {displayConnectionType(status)}
  </div>
</Popover>
