<script lang="ts">
  import {type Instance} from "tippy.js"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    thunks,
    formatTimestampAsTime,
    pubkey,
    deriveProfile,
    deriveProfileDisplay,
  } from "@welshman/app"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import TapTarget from "@lib/components/TapTarget.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ReactionSummary from "@app/components/ReactionSummary.svelte"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ChatMessageMenu from "@app/components/ChatMessageMenu.svelte"
  import ChatMessageMenuMobile from "@app/components/ChatMessageMenuMobile.svelte"
  import {colors} from "@app/state"
  import {makeDelete, makeReaction, sendWrapped} from "@app/commands"
  import {pushModal} from "@app/modal"

  interface Props {
    event: TrustedEvent
    replyTo: (event: TrustedEvent) => void
    pubkeys: string[]
    showPubkey?: boolean
  }

  const {event, replyTo, pubkeys, showPubkey = false}: Props = $props()

  const thunk = $thunks[event.id]
  const isOwn = event.pubkey === $pubkey
  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  const reply = () => replyTo(event)

  const onReactionClick = async (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)
    const template = reaction ? makeDelete({event: reaction}) : makeReaction({event, content})

    await sendWrapped({template, pubkeys})
  }

  const openProfile = () => pushModal(ProfileDetail, {pubkey: event.pubkey})

  const showMobileMenu = () => pushModal(ChatMessageMenuMobile, {event, pubkeys, reply})

  const togglePopover = () => {
    if (popoverIsVisible) {
      popover?.hide()
    } else {
      popover?.show()
    }
  }

  let popover: Instance | undefined = $state()
  let popoverIsVisible = $state(false)
</script>

{#if thunk}
  <ThunkStatus {thunk} class="mt-1" />
{/if}
<div
  data-event={event.id}
  class="group chat flex items-center justify-end gap-1 px-2"
  class:chat-start={!isOwn}
  class:flex-row-reverse={!isOwn}
  class:chat-end={isOwn}>
  {#if !isMobile}
    <Tippy
      bind:popover
      component={ChatMessageMenu}
      props={{event, pubkeys, popover, replyTo}}
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
        onclick={togglePopover}>
        <Icon icon="menu-dots" size={4} />
      </button>
    </Tippy>
  {/if}
  <div class="flex min-w-0 flex-col" class:items-end={isOwn}>
    <TapTarget
      class="bg-alt chat-bubble mx-1 mb-2 flex cursor-auto flex-col gap-1 text-left lg:max-w-2xl"
      onTap={showMobileMenu}>
      {#if showPubkey}
        <div class="flex items-center gap-2">
          {#if !isOwn}
            <Button onclick={openProfile} class="flex items-center gap-1">
              <Avatar
                src={$profile?.picture}
                class="border border-solid border-base-content"
                size={4} />
              <div class="flex items-center gap-2">
                <Button onclick={openProfile} class="text-sm font-bold" style="color: {colorValue}">
                  {$profileDisplay}
                </Button>
              </div>
            </Button>
          {/if}
          <span class="whitespace-nowrap text-xs opacity-50"
            >{formatTimestampAsTime(event.created_at)}</span>
        </div>
      {/if}
      <div class="text-sm">
        <Content showEntire {event} />
      </div>
    </TapTarget>
    <div class="row-2 z-feature -mt-1 ml-4">
      <ReactionSummary {event} {onReactionClick} noTooltip />
    </div>
  </div>
</div>
