<script lang="ts">
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import NoteContent from "@app/components/NoteContent.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import {publishDelete, publishReaction} from "@app/commands"

  const {url, event} = $props()

  const deleteReaction = (event: TrustedEvent) => publishDelete({relays: [url], event})

  const createReaction = (template: EventContent) =>
    publishReaction({...template, event, relays: [url]})

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, content: emoji.unicode, relays: [url]})
</script>

<NoteCard {event} {url} class="card2 bg-alt">
  <NoteContent {event} expandMode="inline" />
  <div class="flex w-full justify-between gap-2">
    <ReactionSummary {url} {event} {deleteReaction} {createReaction} reactionClass="tooltip-right">
      <EmojiButton {onEmoji} class="btn btn-neutral btn-xs h-[26px] rounded-box">
        <Icon icon="smile-circle" size={4} />
      </EmojiButton>
    </ReactionSummary>
  </div>
</NoteCard>
