<script lang="ts">
  import {onMount} from "svelte"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import AlertAdd from "@app/components/AlertAdd.svelte"
  import AlertItem from "@app/components/AlertItem.svelte"
  import {loadAlertStatuses, loadAlerts} from "@app/requests"
  import {pushModal} from "@app/modal"
  import {alerts} from "@app/state"

  const startAlert = () => pushModal(AlertAdd)

  onMount(() => {
    loadAlertStatuses($pubkey!)
    loadAlerts($pubkey!)
  })
</script>

<div class="card2 bg-alt flex flex-col gap-6 shadow-xl">
  <div class="flex items-center justify-between">
    <strong class="flex items-center gap-3">
      <Icon icon="inbox" />
      Alerts
    </strong>
    <Button class="btn btn-primary btn-sm" onclick={startAlert}>
      <Icon icon="add-circle" />
      Add Alert
    </Button>
  </div>
  <div class="col-4">
    {#each $alerts as alert (alert.event.id)}
      <AlertItem {alert} />
    {:else}
      <p class="text-center opacity-75 py-12">No alerts found</p>
    {/each}
  </div>
</div>
