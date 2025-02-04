<script lang="ts">
  import {noop} from "@welshman/lib"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {publishReaction} from "@app/commands"

  const {url, room, event} = $props()

  // Tell svelte-check to shut up
  noop(room)

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, relays: [url], content: emoji.unicode})
</script>

<EmojiButton {onEmoji} class="btn join-item btn-xs">
  <Icon icon="smile-circle" size={4} />
</EmojiButton>
