<script lang="ts">
  import {readable} from 'svelte/store'
  import type {CustomEvent} from '@welshman/util'
  import {GROUP_REPLY, getAncestorTags, displayProfile, displayPubkey} from '@welshman/util'
  import {deriveEvent} from '@welshman/store'
  import {fly} from '@lib/transition'
  import Icon from '@lib/components/Icon.svelte'
  import Avatar from '@lib/components/Avatar.svelte'
  import {repository} from '@app/base'
  import {deriveProfile} from '@app/state'

  export let event: CustomEvent
  export let showPubkey: boolean

  const profile = deriveProfile(event.pubkey)
  const {replies} = getAncestorTags(event.tags)
  const parentEvent = replies.length > 0
    ? deriveEvent(repository, replies[0][1])
    : readable(null)

  $: parentProfile = deriveProfile($parentEvent?.pubkey)
</script>

<div in:fly>
  {#if event.kind === GROUP_REPLY}
    <div class="pl-12">
      <div class="text-xs flex gap-1">
        <Icon icon="arrow-right" />
        <Avatar src={$parentProfile?.picture} size={4}/>
        <p class="text-primary">{displayProfile($parentProfile, displayPubkey($parentEvent.pubkey))}<p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis">{$parentEvent.content}</p>
      </div>
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
        <strong class="text-sm text-primary">{displayProfile($profile, displayPubkey(event.pubkey))}</strong>
      {/if}
      <p class="text-sm">{event.content}</p>
    </div>
  </div>
</div>
