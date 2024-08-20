<script lang="ts">
  import twColors from "tailwindcss/colors"
  import {readable} from "svelte/store"
  import {hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {GROUP_REPLY, getAncestorTags, displayPubkey} from "@welshman/util"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveProfile, deriveProfileDisplay, deriveEvent} from "@app/state"

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
  const {replies} = getAncestorTags(event.tags)
  const parentId = replies[0]?.[1]
  const parentHints = [replies[0]?.[2]].filter(Boolean)
  const parentEvent = parentId ? deriveEvent(parentId, parentHints) : readable(null)
  const [colorName, colorValue] = colors[parseInt(hash(event.pubkey)) % colors.length]

  $: parentPubkey = $parentEvent?.pubkey || replies[0]?.[4]
  $: parentProfile = deriveProfile(parentPubkey)
  $: parentProfileDisplay = deriveProfileDisplay(parentPubkey)
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
      <div class="w-10" />
    {/if}
    <div class="-mt-1">
      {#if showPubkey}
        <strong class="text-sm" style="color: {colorValue}" data-color={colorName}>{$profileDisplay}</strong>
      {/if}
      <p class="text-sm">{event.content}</p>
    </div>
  </div>
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
