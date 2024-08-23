<script lang="ts">
  import twColors from "tailwindcss/colors"
  import {readable, derived} from "svelte/store"
  import {hash, groupBy, now} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {PublishStatus} from "@welshman/net"
  import {GROUP_REPLY, REACTION, ZAP_RESPONSE, displayRelayUrl, getAncestorTags, displayPubkey} from "@welshman/util"
  import {fly, fade} from "@lib/transition"
  import {formatTimestampAsTime} from '@lib/util'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import {repository} from '@app/base'
  import type {PublishStatusData} from "@app/state"
  import {deriveProfile, deriveProfileDisplay, deriveEvent, publishStatusData} from "@app/state"

  export let event: TrustedEvent
  export let showPubkey: boolean

  const colors = [
    ['amber', twColors.amber[600]],
    ['blue', twColors.blue[600]],
    ['cyan', twColors.cyan[600]],
    ['emerald', twColors.emerald[600]],
    ['fuchsia', twColors.fuchsia[600]],
    ['green', twColors.green[600]],
    ['indigo', twColors.indigo[600]],
    ['sky', twColors.sky[600]],
    ['lime', twColors.lime[600]],
    ['orange', twColors.orange[600]],
    ['pink', twColors.pink[600]],
    ['purple', twColors.purple[600]],
    ['red', twColors.red[600]],
    ['rose', twColors.rose[600]],
    ['sky', twColors.sky[600]],
    ['teal', twColors.teal[600]],
    ['violet', twColors.violet[600]],
    ['yellow', twColors.yellow[600]],
    ['zinc', twColors.zinc[600]],
  ]

  const profile = deriveProfile(event.pubkey)
  const profileDisplay = deriveProfileDisplay(event.pubkey)
  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], '#e': [event.id]}]})
  const zaps = deriveEvents(repository, {filters: [{kinds: [ZAP_RESPONSE], '#e': [event.id]}]})
  const {replies} = getAncestorTags(event.tags)
  const parentId = replies[0]?.[1]
  const parentHints = [replies[0]?.[2]].filter(Boolean)
  const parentEvent = parentId ? deriveEvent(parentId, parentHints) : readable(null)
  const [colorName, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]
  const ps = derived(publishStatusData, $m => Object.values($m[event.id] || {}))

  const displayReaction = (content: string) => {
    if (content === '+') return "❤️"
    if (content === '-') return "👎"
    return content
  }

  const findStatus = ($ps: PublishStatusData[], statuses: PublishStatus[]) =>
    $ps.find(({status}) => statuses.includes(status))

  $: parentPubkey = $parentEvent?.pubkey || replies[0]?.[4]
  $: parentProfile = deriveProfile(parentPubkey)
  $: parentProfileDisplay = deriveProfileDisplay(parentPubkey)
  $: isPublished = findStatus($ps, [PublishStatus.Success])
  $: isPending = findStatus($ps, [PublishStatus.Pending]) && event.created_at > now() - 30
  $: failure = !isPending && !isPublished && findStatus($ps, [PublishStatus.Failure, PublishStatus.Timeout])
</script>

<div in:fly class="group relative flex flex-col gap-1 p-2 transition-colors hover:bg-base-300">
  {#if event.kind === GROUP_REPLY}
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
      <div class="min-w-10 max-w-10 w-10" />
    {/if}
    <div class="-mt-1">
      {#if showPubkey}
        <div class="flex gap-2 items-center">
          <strong class="text-sm" style="color: {colorValue}" data-color={colorName}>{$profileDisplay}</strong>
          <span class="opacity-50 text-xs">{formatTimestampAsTime(event.created_at)}</span>
        </div>
      {/if}
      <p class="text-sm">
        {event.content}
        {#if isPending}
          <span class="ml-1 flex-inline gap-1">
            <span class="loading loading-spinner h-3 w-3 mx-1 translate-y-px" />
            <span class="opacity-50">Sending...</span>
          </span>
        {:else if failure}
          <span
            class="ml-1 flex-inline gap-1 tooltip cursor-pointer"
            data-tip="{failure.message} ({displayRelayUrl(failure.url)})">
            <Icon icon="danger" class="translate-y-px" size={3} />
            <span class="opacity-50">Failed to send!</span>
          </span>
        {/if}
      </p>
    </div>
  </div>
  {#if $reactions.length > 0 || $zaps.length > 0}
    <div class="text-xs ml-12">
      {#each groupBy(e => e.content, $reactions).entries() as [content, events]}
        <Button class="btn btn-neutral btn-xs rounded-full mr-2 flex-inline gap-1">
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
    <button class="btn join-item btn-xs">
      <Icon icon="smile-circle" size={4} />
    </button>
    <button class="btn join-item btn-xs">
      <Icon icon="menu-dots" size={4} />
    </button>
  </div>
</div>
