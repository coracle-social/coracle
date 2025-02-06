<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {COMMENT} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import EventReport from "@app/components/EventReport.svelte"
  import EventShare from "@app/components/EventShare.svelte"
  import ConfirmDelete from "@app/components/ConfirmDelete.svelte"
  import {pushModal} from "@app/modal"

  const {
    url,
    noun,
    event,
    onClick,
  }: {
    url: string
    noun: string
    event: TrustedEvent
    onClick: () => void
  } = $props()

  const isRoot = event.kind !== COMMENT

  const report = () => {
    onClick()
    pushModal(EventReport, {url, event})
  }

  const showInfo = () => {
    onClick()
    pushModal(EventInfo, {event})
  }

  const share = () => {
    onClick()
    pushModal(EventShare, {url, event})
  }

  const showDelete = () => {
    onClick()
    pushModal(ConfirmDelete, {url, event})
  }
</script>

<ul class="menu whitespace-nowrap rounded-box bg-base-100 p-2 shadow-xl">
  {#if isRoot}
    <li>
      <Button onclick={share}>
        <Icon size={4} icon="share-circle" />
        Share to Chat
      </Button>
    </li>
  {/if}
  <li>
    <Button onclick={showInfo}>
      <Icon size={4} icon="code-2" />
      {noun} Details
    </Button>
  </li>
  {#if event.pubkey === $pubkey}
    <li>
      <Button onclick={showDelete} class="text-error">
        <Icon size={4} icon="trash-bin-2" />
        Delete {noun}
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
