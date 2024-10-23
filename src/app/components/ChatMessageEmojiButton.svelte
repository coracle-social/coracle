<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent} from "@welshman/util"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import {makeReaction, sendWrapped} from "@app/commands"

  export let event: TrustedEvent
  export let pubkeys: string[]

  const onEmoji = (emoji: NativeEmoji) =>
    sendWrapped({template: makeReaction({event, content: emoji.unicode}), pubkeys})
</script>

<EmojiButton {onEmoji} class="join-item" />
