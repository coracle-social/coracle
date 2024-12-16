<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import ConfirmDelete from "@app/components/ConfirmDelete.svelte"
  import {publishReaction} from "@app/commands"
  import {pushModal} from "@app/modal"

  export let url
  export let event

  const onEmoji = (emoji: NativeEmoji) => {
    history.back()
    publishReaction({event, relays: [url], content: emoji.unicode})
  }

  const showEmojiPicker = () => pushModal(EmojiPicker, {onClick: onEmoji}, {replaceState: true})

  const showInfo = () => pushModal(EventInfo, {event}, {replaceState: true})

  const showDelete = () => pushModal(ConfirmDelete, {url, event})
</script>

<div class="col-2">
  <Button class="btn btn-primary w-full" on:click={showEmojiPicker}>
    <Icon size={4} icon="smile-circle" />
    Send Reaction
  </Button>
  <Button class="btn btn-neutral" on:click={showInfo}>
    <Icon size={4} icon="code-2" />
    Message Details
  </Button>
  {#if event.pubkey === $pubkey}
    <Button class="btn btn-neutral text-error" on:click={showDelete}>
      <Icon size={4} icon="trash-bin-2" />
      Delete Message
    </Button>
  {/if}
</div>
