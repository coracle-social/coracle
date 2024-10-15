<script lang="ts">
  import {derived} from "svelte/store"
  import {type Instance} from "tippy.js"
  import {hash, uniqBy, groupBy, now} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents, throttled} from "@welshman/store"
  import {PublishStatus} from "@welshman/net"
  import {
    publishStatusData,
    deriveProfile,
    deriveProfileDisplay,
    formatTimestampAsTime,
    pubkey,
  } from "@welshman/app"
  import type {PublishStatusData} from "@welshman/app"
  import {REACTION, ZAP_RESPONSE, displayRelayUrl} from "@welshman/util"
  import {repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ChatMessageMenu from "@app/components/ChatMessageMenu.svelte"
  import {colors, displayReaction} from "@app/state"
  import {pushDrawer} from "@app/modal"
  import {makeDelete, makeReaction, sendWrapped} from "@app/commands"

  export let event: TrustedEvent
  export let pubkeys: string[]
  export let showPubkey = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const zaps = deriveEvents(repository, {filters: [{kinds: [ZAP_RESPONSE], "#e": [event.id]}]})
  const [_, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]
  const ps = throttled(300, derived(publishStatusData, $m => Object.values($m[event.wrap!.id] || {})))

  const showProfile = () => pushDrawer(ProfileDetail, {pubkey: event.pubkey})

  const findStatus = ($ps: PublishStatusData[], statuses: PublishStatus[]) =>
    $ps.find(({status}) => statuses.includes(status))

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

  $: isPublished = findStatus($ps, [PublishStatus.Success])
  $: isPending = findStatus($ps, [PublishStatus.Pending]) && event.created_at > now() - 30
  $: failure =
    !isPending && !isPublished && findStatus($ps, [PublishStatus.Failure, PublishStatus.Timeout])
</script>

<div
  class="chat flex gap-1 items-center group justify-end"
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
    <Button class="group-hover:opacity-100 opacity-0 transition-all" on:click={togglePopover}>
      <Icon icon="menu-dots" size={4} />
    </Button>
  </Tippy>
  <div class="flex flex-col">
    <div class="chat-bubble mx-1 max-w-sm">
      <div class="flex items-start gap-2 w-full">
        {#if showPubkey}
          <Button on:click={showProfile}>
            <Avatar
              src={$profile?.picture}
              class="border border-solid border-base-content"
              size={10} />
          </Button>
        {/if}
        <div class="-mt-1 flex-grow pr-1">
          {#if showPubkey}
            <div class="flex items-center gap-2">
              <Button class="text-bold text-sm" style="color: {colorValue}" on:click={showProfile}>
                {$profileDisplay}
              </Button>
              <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
            </div>
          {/if}
          <div class="text-sm">
            <Content showEntire {event} />
            {#if isPending}
              <span class="flex-inline ml-1 gap-1">
                <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px" />
                <span class="opacity-50">Sending...</span>
              </span>
            {:else if failure}
              <span
                class="flex-inline tooltip ml-1 cursor-pointer gap-1"
                data-tip="{failure.message} ({displayRelayUrl(failure.url)})">
                <Icon icon="danger" class="translate-y-px" size={3} />
                <span class="opacity-50">Failed to send!</span>
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>
    {#if $reactions.length > 0 || $zaps.length > 0}
      <div class="-mt-4 text-xs z-feature relative flex justify-end">
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
