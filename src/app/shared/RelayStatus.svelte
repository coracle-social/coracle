<script lang="ts">
  import {onMount} from "svelte"
  import {ctx} from "@welshman/lib"
  import {ConnectionStatus, AuthStatus} from "@welshman/net"

  export let url

  const pendingStatuses = [
    AuthStatus.Requested,
    AuthStatus.PendingSignature,
    AuthStatus.PendingResponse,
  ]
  const failureStatuses = [AuthStatus.DeniedSignature, AuthStatus.Forbidden]

  let statusHover = false
  let description = "Not connected"
  let className = "bg-neutral-600"

  onMount(() => {
    const interval = setInterval(() => {
      const cxn = ctx.net.pool.get(url, {autoConnect: false})

      if (!cxn) return

      if (pendingStatuses.includes(cxn.auth.status)) {
        className = "bg-warning"
        description = "Logging in"
      } else if (failureStatuses.includes(cxn.auth.status)) {
        className = "bg-danger"
        description = "Failed to log in"
      } else if (cxn.meta.getStatus() === ConnectionStatus.Error) {
        className = "bg-danger"
        description = "Failed to connect"
      } else if (cxn.meta.getStatus() === ConnectionStatus.Closed) {
        className = "bg-warning"
        description = "Waiting to reconnect"
      } else if (cxn.meta.getStatus() === ConnectionStatus.Slow) {
        className = "bg-warning"
        description = "Slow connection"
      } else if (cxn.meta.getStatus() === ConnectionStatus.Ok) {
        className = "bg-success"
        description = "Connected"
      }
    }, 800)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<span
  class="h-2 w-2 cursor-pointer rounded-full {className}"
  on:mouseout={() => {
    statusHover = false
  }}
  on:mouseover={() => {
    statusHover = true
  }} />
<p
  class="hidden text-sm text-neutral-100 transition-all sm:block"
  class:opacity-0={!statusHover}
  class:opacity-1={statusHover}>
  {description}
</p>
