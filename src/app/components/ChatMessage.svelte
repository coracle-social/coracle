<script lang="ts">
  import {onMount} from 'svelte'
  import {type Instance} from "tippy.js"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestampAsTime, pubkey} from "@welshman/app"
  import type {MergedThunk} from "@welshman/app"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import LongPress from "@lib/components/LongPress.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Button from "@lib/components/Button.svelte"
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
  export let thunk: MergedThunk
  export let pubkeys: string[]
  export let showPubkey = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const onReactionClick = async (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)
    const template = reaction ? makeDelete({event}) : makeReaction({event, content})

    await sendWrapped({template, pubkeys})
  }

  const showMobileMenu = () =>
    pushModal(ChatMessageMenuMobile, {event})

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
    <button
      type="button"
      class="opacity-0 transition-all"
      class:group-hover:opacity-100={!isMobile}
      on:click={togglePopover}>
      <Icon icon="menu-dots" size={4} />
    </button>
  </Tippy>
  <div class="flex flex-col">
    <LongPress class="text-left chat-bubble mx-1 max-w-sm" onLongPress={showMobileMenu}>
      <div class="flex w-full items-start gap-2">
        {#if showPubkey}
          <Link external href={pubkeyLink(event.pubkey)}>
            <Avatar
              src={$profile?.picture}
              class="border border-solid border-base-content"
              size={8} />
          </Link>
        {/if}
        <div class="-mt-1 flex-grow pr-1">
          {#if showPubkey}
            <div class="flex items-center gap-2">
              <Link
                external
                href={pubkeyLink(event.pubkey)}
                class="text-sm font-bold"
                style="color: {colorValue}">
                {$profileDisplay}
              </Link>
              <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
            </div>
          {/if}
          <div class="text-sm">
            <Content showEntire {event} />
          </div>
        </div>
      </div>
    </LongPress>
    <div class="row-2 ml-4 -mt-1 z-feature">
      <ReplySummary {event} />
      <ReactionSummary {event} {onReactionClick} />
    </div>
  </div>
</div>
