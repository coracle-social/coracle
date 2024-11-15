<script lang="ts">
  import {type Instance} from "tippy.js"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    thunks,
    deriveProfile,
    deriveProfileDisplay,
    formatTimestampAsTime,
    pubkey,
  } from "@welshman/app"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import LongPress from "@lib/components/LongPress.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ReplySummary from "@app/components/ReplySummary.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ChatMessageMenu from "@app/components/ChatMessageMenu.svelte"
  import ChatMessageMenuMobile from "@app/components/ChatMessageMenuMobile.svelte"
  import {colors, pubkeyLink} from "@app/state"
  import {makeDelete, makeReaction, sendWrapped} from "@app/commands"
  import {pushModal} from "@app/modal"

  export let event: TrustedEvent
  export let pubkeys: string[]
  export let showPubkey = false

  const thunk = $thunks[event.id]
  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const onReactionClick = async (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)
    const template = reaction ? makeDelete({event: reaction}) : makeReaction({event, content})

    await sendWrapped({template, pubkeys})
  }

  const showMobileMenu = () => pushModal(ChatMessageMenuMobile, {event, pubkeys})

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
  <ThunkStatus {thunk} class="mt-1" />
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
    <button
      type="button"
      class="opacity-0 transition-all"
      class:group-hover:opacity-100={!isMobile}
      on:click={togglePopover}>
      <Icon icon="menu-dots" size={4} />
    </button>
  </Tippy>
  <div class="flex min-w-0 flex-col">
    <LongPress
      class="bg-alt chat-bubble mx-1 flex cursor-auto flex-col gap-1 text-left lg:max-w-2xl"
      onLongPress={showMobileMenu}>
      {#if showPubkey && event.pubkey !== $pubkey}
        <div class="flex items-center gap-2">
          <Link external href={pubkeyLink(event.pubkey)} class="flex items-center gap-1">
            <Avatar
              src={$profile?.picture}
              class="border border-solid border-base-content"
              size={4} />
            <div class="flex items-center gap-2">
              <Link
                external
                href={pubkeyLink(event.pubkey)}
                class="text-sm font-bold"
                style="color: {colorValue}">
                {$profileDisplay}
              </Link>
            </div>
          </Link>
          <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
        </div>
      {/if}
      <div class="text-sm">
        <Content showEntire {event} />
      </div>
    </LongPress>
    <div class="row-2 z-feature -mt-1 ml-4">
      <ReplySummary {event} />
      <ReactionSummary {event} {onReactionClick} />
    </div>
  </div>
</div>
