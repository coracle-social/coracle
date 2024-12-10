<script lang="ts">
  import {COMMENT} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import ThreadShare from "@app/components/ThreadShare.svelte"
  import ConfirmDelete from "@app/components/ConfirmDelete.svelte"
  import {pushModal} from "@app/modal"

  export let url
  export let event
  export let onClick

  const isRoot = event.kind !== COMMENT

  const showInfo = () => {
    onClick()
    pushModal(EventInfo, {event})
  }

  const share = () => {
    onClick()
    pushModal(ThreadShare, {url, event})
  }

  const showDelete = () => {
    onClick()
    pushModal(ConfirmDelete, {url, event})
  }
</script>

<ul class="menu whitespace-nowrap rounded-box bg-base-100 p-2 shadow-xl">
  {#if isRoot}
    <li>
      <Button on:click={share}>
        <Icon size={4} icon="share-circle" />
        Share to Chat
      </Button>
    </li>
  {/if}
  <li>
    <Button on:click={showInfo}>
      <Icon size={4} icon="code-2" />
      Message Details
    </Button>
  </li>
  {#if event.pubkey === $pubkey}
    <li>
      <Button on:click={showDelete} class="text-error">
        <Icon size={4} icon="trash-bin-2" />
        Delete Message
      </Button>
    </li>
  {/if}
</ul>
