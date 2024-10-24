<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Confirm from "@lib/components/Confirm.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import ThreadShare from "@app/components/ThreadShare.svelte"
  import {publishDelete} from "@app/commands"
  import {pushModal} from "@app/modal"
  import {REPLY} from "@app/state"

  export let url
  export let event
  export let onClick

  const isRoot = event.kind !== REPLY

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
    pushModal(Confirm, {
      title: "Delete Message",
      subtitle: "Are you sure you want to delete this message?",
      message: `
        This will send a request to delete this message.
        Be aware that not all relays may honor this request.`,
      confirm: async () => {
        await publishDelete({event, relays: [url]})

        history.back()
      },
    })
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
