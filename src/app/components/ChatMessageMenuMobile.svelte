<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent} from "@welshman/util"
  import {sendWrapped} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import {makeReaction} from "@app/commands"
  import {pushModal} from "@app/modal"
  import {clip} from "@app/toast"

  type Props = {
    pubkeys: string[]
    event: TrustedEvent
    reply: () => void
  }

  const {event, pubkeys, reply}: Props = $props()

  const onEmoji = ((event: TrustedEvent, pubkeys: string[], emoji: NativeEmoji) => {
    history.back()
    sendWrapped({template: makeReaction({event, content: emoji.unicode}), pubkeys})
  }).bind(undefined, event, pubkeys)

  const showEmojiPicker = () => pushModal(EmojiPicker, {onClick: onEmoji}, {replaceState: true})

  const sendReply = () => {
    history.back()
    reply()
  }

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
  <Button class="btn btn-neutral w-full" onclick={sendReply}>
    <Icon size={4} icon="reply" />
    Send Reply
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
