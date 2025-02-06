<script lang="ts">
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import type {TrustedEvent} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import EmojiButton from "@lib/components/EmojiButton.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatusOrDeleted from "@app/components/ThunkStatusOrDeleted.svelte"
  import CalendarEventMenu from "@app/components/CalendarEventMenu.svelte"
  import EventActivity from "@app/components/EventActivity.svelte"
  import {publishDelete, publishReaction} from "@app/commands"
  import {makeCalendarPath} from "@app/routes"

  const {
    url,
    event,
    showActivity = false,
  }: {
    url: string
    event: TrustedEvent
    showActivity?: boolean
  } = $props()

  const path = makeCalendarPath(url, event.id)

  const showPopover = () => popover?.show()

  const hidePopover = () => popover?.hide()

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

  let popover: Instance | undefined = $state()
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <div class="flex flex-grow flex-wrap justify-end gap-2">
    <ReactionSummary {url} {event} {onReactionClick} reactionClass="tooltip-left" />
    <ThunkStatusOrDeleted {event} />
    {#if showActivity}
      <EventActivity {url} {path} {event} />
    {/if}
    <Button class="join rounded-full">
      <EmojiButton {onEmoji} class="btn join-item btn-neutral btn-xs">
        <Icon icon="smile-circle" size={4} />
      </EmojiButton>
      <Tippy
        bind:popover
        component={CalendarEventMenu}
        props={{url, event, onClick: hidePopover}}
        params={{trigger: "manual", interactive: true}}>
        <Button class="btn join-item btn-neutral btn-xs" onclick={showPopover}>
          <Icon icon="menu-dots" size={4} />
        </Button>
      </Tippy>
    </Button>
  </div>
</div>
