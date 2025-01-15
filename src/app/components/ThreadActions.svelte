<script lang="ts">
  import {onMount} from "svelte"
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {max} from "@welshman/lib"
  import {deriveEvents, deriveIsDeleted} from "@welshman/store"
  import type {TrustedEvent} from "@welshman/util"
  import {COMMENT} from "@welshman/util"
  import {thunks, load, pubkey, repository, formatTimestampRelative} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ThreadMenu from "@app/components/ThreadMenu.svelte"
  import {publishDelete, publishReaction} from "@app/commands"
  import {notifications} from "@app/notifications"
  import {makeSpacePath} from "@app/routes"

  export let url
  export let event
  export let showActivity = false

  const thunk = $thunks[event.id]
  const deleted = deriveIsDeleted(repository, event)
  const path = makeSpacePath(url, "threads", event.id)
  const filters = [{kinds: [COMMENT], "#E": [event.id]}]
  const replies = deriveEvents(repository, {filters})

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
    publishReaction({event, content: emoji.unicode, relays: [url]})

  let popover: Instance

  $: lastActive = max([...$replies, event].map(e => e.created_at))

  onMount(() => {
    load({relays: [url], filters})
  })
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <div class="flex flex-grow flex-wrap justify-end gap-2">
    <ReactionSummary {url} {event} {onReactionClick} reactionClass="tooltip-left" />
    {#if $deleted}
      <div class="btn btn-error btn-xs rounded-full">Deleted</div>
    {:else if thunk}
      <ThunkStatus {thunk} />
    {/if}
    {#if showActivity}
      <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
        <Icon icon="reply" />
        <span>{$replies.length} {$replies.length === 1 ? "reply" : "replies"}</span>
      </div>
      <div class="btn btn-neutral btn-xs relative hidden rounded-full sm:flex">
        {#if $notifications.has(path)}
          <div class="h-2 w-2 rounded-full bg-primary" />
        {/if}
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
