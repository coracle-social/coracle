<script lang="ts">
  import {readable} from "svelte/store"
  import type {CustomEvent} from "@welshman/util"
  import {GROUP_REPLY, getAncestorTags, displayProfile, displayPubkey} from "@welshman/util"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveProfile, deriveEvent} from "@app/state"

  export let event: CustomEvent
  export let showPubkey: boolean

  const profile = deriveProfile(event.pubkey)
  const {replies} = getAncestorTags(event.tags)
  const parentEvent =
    replies.length > 0 ? deriveEvent(replies[0][1], [replies[0][2]]) : readable(null)

  $: parentPubkey = $parentEvent?.pubkey || replies[0]?.[4]
  $: parentProfile = deriveProfile(parentPubkey)
</script>

<div in:fly class="group relative flex flex-col gap-1 p-2 transition-colors hover:bg-base-300">
  {#if event.kind === GROUP_REPLY}
    <div class="flex items-center gap-1 pl-12 text-xs">
      <Icon icon="arrow-right" />
      <Avatar src={$parentProfile?.picture} size={4} />
      <p class="text-primary">{displayProfile($parentProfile, displayPubkey(parentPubkey))}</p>
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
        <strong class="text-sm text-primary"
          >{displayProfile($profile, displayPubkey(event.pubkey))}</strong>
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
