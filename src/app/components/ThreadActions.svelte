<script lang="ts">
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {max} from "@welshman/lib"
  import {deriveEvents, deriveIsDeleted} from "@welshman/store"
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey, repository, formatTimestampRelative} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThreadMenu from "@app/components/ThreadMenu.svelte"
  import {publishDelete, publishReaction} from "@app/commands"
  import {COMMENT} from "@app/state"

  export let url
  export let event
  export let showActivity = false

  const deleted = deriveIsDeleted(repository, event)

  const replies = deriveEvents(repository, {filters: [{kinds: [COMMENT], "#E": [event.id]}]})

  const showPopover = () => popover.show()

  const hidePopover = () => popover.hide()

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({event, content, relays: [url]})
    }
  }

  const onEmoji = (emoji: NativeEmoji) =>
    publishReaction({event, relays: [url], content: emoji.unicode})

  let popover: Instance

  $: lastActive = max([...$replies, event].map(e => e.created_at))
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <ReactionSummary {event} {onReactionClick} />
  <div class="flex flex-grow flex-wrap justify-end gap-2">
    {#if $deleted}
      <div class="btn btn-error btn-xs rounded-full">Deleted</div>
    {/if}
    {#if showActivity}
      <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
        <Icon icon="reply" />
        <span>{$replies.length} {$replies.length === 1 ? "reply" : "replies"}</span>
      </div>
      <div class="btn btn-neutral btn-xs hidden rounded-full sm:flex">
        Active {formatTimestampRelative(lastActive)}
      </div>
    {/if}
    <Button class="join rounded-full">
      <EmojiButton {onEmoji} class="btn join-item btn-neutral btn-xs">
        <Icon icon="smile-circle" size={4} />
      </EmojiButton>
      <Tippy
        bind:popover
        component={ThreadMenu}
        props={{url, event, onClick: hidePopover}}
        params={{trigger: "manual", interactive: true}}>
        <Button class="btn join-item btn-neutral btn-xs" on:click={showPopover}>
          <Icon icon="menu-dots" size={4} />
        </Button>
      </Tippy>
    </Button>
  </div>
</div>
