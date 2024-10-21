<script lang="ts">
  import {type Instance} from "tippy.js"
  import {hash, uniqBy, groupBy} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {deriveProfile, deriveProfileDisplay, formatTimestampAsTime, pubkey} from "@welshman/app"
  import type {MergedThunk} from "@welshman/app"
  import {REACTION, ZAP_RESPONSE} from "@welshman/util"
  import {repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ChatMessageMenu from "@app/components/ChatMessageMenu.svelte"
  import {colors, displayReaction} from "@app/state"
  import {pushDrawer} from "@app/modal"
  import {makeDelete, makeReaction, sendWrapped} from "@app/commands"

  export let event: TrustedEvent
  export let thunk: MergedThunk
  export let pubkeys: string[]
  export let showPubkey = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const zaps = deriveEvents(repository, {filters: [{kinds: [ZAP_RESPONSE], "#e": [event.id]}]})
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const showProfile = () => pushDrawer(ProfileDetail, {pubkey: event.pubkey})

  const onReactionClick = async (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)
    const template = reaction ? makeDelete({event}) : makeReaction({event, content})

    await sendWrapped({template, pubkeys})
  }

  const togglePopover = () => {
    if (popoverIsVisible) {
      popover.hide()
    } else {
      popover.show()
    }
  }

  let popover: Instance
  let popoverIsVisible = false
</script>

<div
  class="group chat flex items-center justify-end gap-1 px-2"
  class:chat-start={event.pubkey !== $pubkey}
  class:flex-row-reverse={event.pubkey !== $pubkey}
  class:chat-end={event.pubkey === $pubkey}>
  <Tippy
    bind:popover
    component={ChatMessageMenu}
    props={{event, pubkeys, popover}}
    params={{
      interactive: true,
      trigger: "manual",
      onShow() {
        popoverIsVisible = true
      },
      onHidden() {
        popoverIsVisible = false
      },
    }}>
    <Button class="opacity-0 transition-all group-hover:opacity-100" on:click={togglePopover}>
      <Icon icon="menu-dots" size={4} />
    </Button>
  </Tippy>
  <div class="flex flex-col">
    <div class="chat-bubble mx-1 max-w-sm">
      <div class="flex w-full items-start gap-2">
        {#if showPubkey}
          <Button on:click={showProfile}>
            <Avatar
              src={$profile?.picture}
              class="border border-solid border-base-content"
              size={8} />
          </Button>
        {/if}
        <div class="-mt-1 flex-grow pr-1">
          {#if showPubkey}
            <div class="flex items-center gap-2">
              <Button class="text-sm font-bold" style="color: {colorValue}" on:click={showProfile}>
                {$profileDisplay}
              </Button>
              <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
            </div>
          {/if}
          <div class="text-sm">
            <Content showEntire {event} />
            {#if thunk}
              <ThunkStatus {thunk} />
            {/if}
          </div>
        </div>
      </div>
    </div>
    {#if $reactions.length > 0 || $zaps.length > 0}
      <div class="relative z-feature -mt-4 flex justify-end text-xs">
        {#each groupBy( e => e.content, uniqBy(e => e.pubkey + e.content, $reactions), ).entries() as [content, events]}
          {@const isOwn = events.some(e => e.pubkey === $pubkey)}
          {@const onClick = () => onReactionClick(content, events)}
          <button
            type="button"
            class="flex-inline btn btn-neutral btn-xs mr-2 gap-1 rounded-full"
            class:border={isOwn}
            class:border-solid={isOwn}
            class:border-primary={isOwn}
            on:click|stopPropagation={onClick}>
            <span>{displayReaction(content)}</span>
            {#if events.length > 1}
              <span>{events.length}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
