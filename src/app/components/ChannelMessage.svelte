<script lang="ts">
  import {readable, derived} from "svelte/store"
  import {hash, ellipsize, uniqBy, groupBy, now} from "@welshman/lib"
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
  import {slideAndFade} from '@lib/transition'
  import Icon from "@lib/components/Icon.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ChannelThread from "@app/components/ChannelThread.svelte"
  import ChannelMessageEmojiButton from "@app/components/ChannelMessageEmojiButton.svelte"
  import {colors, tagRoom, deriveEvent, displayReaction} from "@app/state"
  import {publishDelete, publishReaction} from "@app/commands"
  import {pushModal} from "@app/modal"

  export let url
  export let room
  export let event: TrustedEvent
  export let showPubkey = false
  export let hideParent = false

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const zaps = deriveEvents(repository, {filters: [{kinds: [ZAP_RESPONSE], "#e": [event.id]}]})
  const rootTag = event.tags.find(t => t[0].match(/^e$/i))
  const rootId = rootTag?.[1]
  const rootHints = [rootTag?.[2]].filter(Boolean) as string[]
  const rootEvent = rootId ? deriveEvent(rootId, rootHints) : readable(null)
  const [colorName, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]
  const ps = throttled(300, derived(publishStatusData, $m => Object.values($m[event.id] || {})))

  const findStatus = ($ps: PublishStatusData[], statuses: PublishStatus[]) =>
    $ps.find(({status}) => statuses.includes(status))

  const openThread = () => {
    const root = $rootEvent || event

    pushModal(ChannelThread, {url, room, event: root}, {drawer: true})
  }

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      publishDelete({relays: [url], event: reaction})
    } else {
      publishReaction({
        event,
        content,
        relays: [url],
        tags: [tagRoom(room, url)],
      })
    }
  }

  $: rootPubkey = $rootEvent?.pubkey || rootTag?.[4]
  $: rootProfile = deriveProfile(rootPubkey || "")
  $: rootProfileDisplay = deriveProfileDisplay(rootPubkey || "")
  $: isPublished = findStatus($ps, [PublishStatus.Success])
  $: isPending = findStatus($ps, [PublishStatus.Pending]) && event.created_at > now() - 30
  $: failure =
    !isPending && !isPublished && findStatus($ps, [PublishStatus.Failure, PublishStatus.Timeout])
</script>

<button
  type="button"
  on:click={openThread}
  class="group relative flex w-full flex-col gap-1 p-2 text-left transition-colors hover:bg-base-300">
  {#if $rootEvent && !hideParent}
    <div class="flex items-center gap-1 pl-12 text-xs">
      <Icon icon="square-share-line" size={3} />
      <p>In reply to</p>
      <Avatar src={$rootProfile?.picture} size={4} />
      <p class="text-primary">{$rootProfileDisplay}</p>
      <p
        class="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap opacity-75 hover:underline">
        {ellipsize($rootEvent.content, 30)}
      </p>
    </div>
  {/if}
  <div class="flex gap-2 w-full">
    {#if showPubkey}
      <Avatar src={$profile?.picture} class="border border-solid border-base-content" size={10} />
    {:else}
      <div class="w-10 min-w-10 max-w-10" />
    {/if}
    <div class="-mt-1 flex-grow pr-1">
      {#if showPubkey}
        <div class="flex items-center gap-2">
          <strong class="text-sm" style="color: {colorValue}" data-color={colorName}
            >{$profileDisplay}</strong>
          <span class="text-xs opacity-50">{formatTimestampAsTime(event.created_at)}</span>
        </div>
      {/if}
      <div class="text-sm col-1">
        <Content {event} />
        {#if isPending}
          <div class="flex gap-1 justify-end items-center" transition:slideAndFade>
            <span class="loading loading-spinner mx-1 h-3 w-3" />
            <span class="opacity-50">Sending...</span>
          </div>
        {:else if failure}
          <div
            class="flex tooltip cursor-pointer gap-1 justify-end items-center"
            data-tip="{failure.message} ({displayRelayUrl(failure.url)})"
            transition:slideAndFade>
            <Icon icon="danger" size={3} />
            <span class="opacity-50">Failed to send!</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  {#if $reactions.length > 0 || $zaps.length > 0}
    <div class="ml-12 text-xs">
      {#each groupBy(e => e.content, uniqBy(e => e.pubkey + e.content, $reactions)).entries() as [content, events]}
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
  <button
    class="join absolute -top-2 right-0 border border-solid border-neutral text-xs opacity-0 transition-all group-hover:opacity-100"
    on:click|stopPropagation>
    <ChannelMessageEmojiButton {url} {room} {event} />
    <button class="btn join-item btn-xs">
      <Icon icon="menu-dots" size={4} />
    </button>
  </button>
</button>
