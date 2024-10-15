<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ChatMessageEmojiButton from "@app/components/ChatMessageEmojiButton.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import {pushModal} from "@app/modal"

  export let event
  export let pubkeys
  export let popover

  const showInfo = () => {
    popover.hide()
    pushModal(EventInfo, {event})
  }
</script>

<div class="join border border-solid border-neutral text-xs">
  <ChatMessageEmojiButton {event} {pubkeys} />
  <Button class="btn join-item btn-xs" on:click={showInfo}>
    <Icon size={4} icon="code-2" />
  </Button>
</div>
