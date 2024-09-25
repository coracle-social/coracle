<script lang="ts">
  import {onMount} from "svelte"
  import type {Emoji} from 'emoji-picker-element/shared'
  import twColors from "tailwindcss/colors"
  import type {Readable} from "svelte/store"
  import {readable, derived} from "svelte/store"
  import {hash, uniqBy, groupBy, now} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {PublishStatus} from "@welshman/net"
  import {
    publishStatusData,
    deriveProfile,
    deriveProfileDisplay,
    formatTimestampAsTime,
    tagReactionTo,
    tagEvent,
    makeThunk,
    publishThunk,
    pubkey,
  } from "@welshman/app"
  import type {PublishStatusData} from "@welshman/app"
  import {REACTION, DELETE, ZAP_RESPONSE, createEvent, displayRelayUrl, getAncestorTags} from "@welshman/util"
  import {repository} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Content from "@app/components/Content.svelte"
  import ChatMessageEmojiButton from "@app/components/ChatMessageEmojiButton.svelte"
  import {ROOM, REPLY, deriveEvent, displayReaction} from "@app/state"

  export let url
  export let room
  export let event: TrustedEvent
  export let showPubkey: boolean

  const colors = [
    ["amber", twColors.amber[600]],
    ["blue", twColors.blue[600]],
    ["cyan", twColors.cyan[600]],
    ["emerald", twColors.emerald[600]],
    ["fuchsia", twColors.fuchsia[600]],
    ["green", twColors.green[600]],
    ["indigo", twColors.indigo[600]],
    ["sky", twColors.sky[600]],
    ["lime", twColors.lime[600]],
    ["orange", twColors.orange[600]],
    ["pink", twColors.pink[600]],
    ["purple", twColors.purple[600]],
    ["red", twColors.red[600]],
    ["rose", twColors.rose[600]],
    ["sky", twColors.sky[600]],
    ["teal", twColors.teal[600]],
    ["violet", twColors.violet[600]],
    ["yellow", twColors.yellow[600]],
    ["zinc", twColors.zinc[600]],
  ]

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const zaps = deriveEvents(repository, {filters: [{kinds: [ZAP_RESPONSE], "#e": [event.id]}]})
  const {replies} = getAncestorTags(event.tags)
  const parentId = replies[0]?.[1]
  const parentHints = [replies[0]?.[2]].filter(Boolean)
  const parentEvent = parentId ? deriveEvent(parentId, parentHints) : readable(null)
  const [colorName, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]
  const ps = derived(publishStatusData, $m => Object.values($m[event.id] || {}))

  const findStatus = ($ps: PublishStatusData[], statuses: PublishStatus[]) =>
    $ps.find(({status}) => statuses.includes(status))

  const createReaction = (content: string) => {
    const reaction = createEvent(REACTION, {
      content,
      tags: [
        [ROOM, room, url],
        ...tagReactionTo(event),
      ],
    })

    publishThunk(makeThunk({event: reaction, relays: [url]}))
  }

  const onReactionClick = (content: string, events: TrustedEvent[]) => {
    const reaction = events.find(e => e.pubkey === $pubkey)

    if (reaction) {
      const deleteEvent = createEvent(DELETE, {
        tags: [["k", String(reaction.kind)], ...tagEvent(reaction)],
      })

      publishThunk(makeThunk({event: deleteEvent, relays: [url]}))
    } else {
      createReaction(content)
    }
  }

  const onEmoji = (emoji: Emoji) => createReaction(emoji.unicode)

  $: parentPubkey = $parentEvent?.pubkey || replies[0]?.[4]
  $: parentProfile = deriveProfile(parentPubkey || "")
  $: parentProfileDisplay = deriveProfileDisplay(parentPubkey || "")
  $: isPublished = findStatus($ps, [PublishStatus.Success])
  $: isPending = findStatus($ps, [PublishStatus.Pending]) && event.created_at > now() - 30
  $: failure =
    !isPending && !isPublished && findStatus($ps, [PublishStatus.Failure, PublishStatus.Timeout])
</script>

<div in:fly class="group relative flex flex-col gap-1 p-2 transition-colors hover:bg-base-300">
  {#if event.kind === REPLY}
    <div class="flex items-center gap-1 pl-12 text-xs">
      <Icon icon="arrow-right" />
      <Avatar src={$parentProfile?.picture} size={4} />
      <p class="text-primary">{$parentProfileDisplay}</p>
      <p></p>
      <p
        class="flex cursor-pointer items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap opacity-75 hover:underline">
        <Icon icon="square-share-line" size={3} />
        {$parentEvent?.content || "View note"}
      </p>
    </div>
  {/if}
  <div class="flex gap-2">
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
      <div class="text-sm">
        <Content {event} />
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
  {#if $reactions.length > 0 || $zaps.length > 0}
    <div class="ml-12 text-xs">
      {#each groupBy(e => e.content, uniqBy(e => e.pubkey + e.content, $reactions)).entries() as [content, events]}
        <Button class="flex-inline btn btn-neutral btn-xs mr-2 gap-1 rounded-full" on:click={() => onReactionClick(content, events)}>
          <span>{displayReaction(content)}</span>
          {#if events.length > 1}
            <span>{events.length}</span>
          {/if}
        </Button>
      {/each}
    </div>
  {/if}
  <div
    class="join absolute -top-2 right-0 border border-solid border-neutral text-xs opacity-0 transition-all group-hover:opacity-100">
    <button class="btn join-item btn-xs">
      <Icon icon="reply" size={4} />
    </button>
    <ChatMessageEmojiButton onEmoji={onEmoji} />
    <button class="btn join-item btn-xs">
      <Icon icon="menu-dots" size={4} />
    </button>
  </div>
</div>
