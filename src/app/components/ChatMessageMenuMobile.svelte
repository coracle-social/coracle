<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import {makeReaction, sendWrapped} from "@app/commands"
  import {pushModal} from "@app/modal"
  import {clip} from "@app/toast"

  const {event, pubkeys} = $props()

  const onEmoji = (emoji: NativeEmoji) => {
    history.back()
    sendWrapped({template: makeReaction({event, content: emoji.unicode}), pubkeys})
  }

  const showEmojiPicker = () => pushModal(EmojiPicker, {onClick: onEmoji}, {replaceState: true})

  const copyText = () => {
    history.back()
    clip(event.content)
  }

  const showInfo = () => pushModal(EventInfo, {event}, {replaceState: true})
</script>

<div class="col-2">
  <Button class="btn btn-primary w-full" onclick={showEmojiPicker}>
    <Icon size={4} icon="smile-circle" />
    Send Reaction
  </Button>
  <Button class="btn btn-neutral w-full" onclick={copyText}>
    <Icon size={4} icon="copy" />
    Copy Text
  </Button>
  <Button class="btn btn-neutral" onclick={showInfo}>
    <Icon size={4} icon="code-2" />
    Message Details
  </Button>
</div>
