<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import {makeReaction, sendWrapped} from "@app/commands"

  interface Props {
    event: TrustedEvent
    pubkeys: string[]
  }

  const {event, pubkeys}: Props = $props()

  const onEmoji = (emoji: NativeEmoji) =>
    sendWrapped({template: makeReaction({event, content: emoji.unicode}), pubkeys})
</script>

<EmojiButton {onEmoji} class="btn join-item btn-xs">
  <Icon icon="smile-circle" size={4} />
</EmojiButton>
