<script lang="ts">
  import {type Instance} from "tippy.js"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestampAsTime, pubkey} from "@welshman/app"
  import type {MergedThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import Reactions from "@app/components/Reactions.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ChatMessageMenu from "@app/components/ChatMessageMenu.svelte"
  import {colors} from "@app/state"
  import {pushDrawer} from "@app/modal"
  import {makeDelete, makeReaction, sendWrapped} from "@app/commands"

  export let event: TrustedEvent
  export let thunk: MergedThunk
  export let pubkeys: string[]
  export let showPubkey = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
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

{#if thunk}
  <ThunkStatus {thunk} />
{/if}
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
          </div>
        </div>
      </div>
    </div>
    <Reactions {event} {onReactionClick} />
  </div>
</div>
