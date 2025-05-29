<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {publishReaction} from "@app/commands"

  const {url, event} = $props()

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, relays: [url], content: emoji.unicode})
</script>

<EmojiButton {onEmoji} class="btn join-item btn-xs">
  <Icon icon="smile-circle" size={4} />
</EmojiButton>
