<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import EventReport from "@app/components/EventReport.svelte"
  import ConfirmDelete from "@app/components/ConfirmDelete.svelte"
  import {pushModal} from "@app/modal"

  const {url, event, onClick} = $props()

  const report = () => {
    onClick()
    pushModal(EventReport, {url, event})
  }

  const showInfo = () => {
    onClick()
    pushModal(EventInfo, {event})
  }

  const showDelete = () => {
    onClick()
    pushModal(ConfirmDelete, {url, event})
  }
</script>

<ul class="menu whitespace-nowrap rounded-box bg-base-100 p-2 shadow-xl">
  <li>
    <Button onclick={showInfo}>
      <Icon size={4} icon="code-2" />
      Message Details
    </Button>
  </li>
  {#if event.pubkey === $pubkey}
    <li>
      <Button onclick={showDelete} class="text-error">
        <Icon size={4} icon="trash-bin-2" />
        Delete Message
      </Button>
    </li>
  {:else}
    <li>
      <Button class="text-error" onclick={report}>
        <Icon size={4} icon="danger" />
        Report Content
      </Button>
    </li>
  {/if}
</ul>
