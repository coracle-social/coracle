<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ChatMessageEmojiButton from "@app/components/ChatMessageEmojiButton.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import {pushModal} from "@app/modal"

  const {event, pubkeys, popover, replyTo} = $props()

  const reply = () => replyTo(event)

  const showInfo = () => {
    popover.hide()
    pushModal(EventInfo, {event})
  }
</script>

<div class="join border border-solid border-neutral text-xs">
  <ChatMessageEmojiButton {event} {pubkeys} />
  {#if replyTo}
    <Button class="btn join-item btn-xs" onclick={reply}>
      <Icon size={4} icon="reply" />
    </Button>
  {/if}
  <Button class="btn join-item btn-xs" onclick={showInfo}>
    <Icon size={4} icon="code-2" />
  </Button>
</div>
