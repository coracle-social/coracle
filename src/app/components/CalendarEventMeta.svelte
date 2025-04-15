<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"

  type Props = {
    event: TrustedEvent
    url: string
  }

  const {event, url}: Props = $props()
  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
</script>

<div class="flex min-w-0 flex-col gap-1 text-sm opacity-75">
  <span class="flex items-center gap-1">
    <Icon icon="user-circle" size={4} />
    Posted by <ProfileLink pubkey={event.pubkey} {url} />
  </span>
  {#if meta.location}
    <span class="flex items-start gap-1">
      <Icon icon="map-point" class="mt-[2px]" size={4} />
      <span class="break-words">{meta.location}</span>
    </span>
  {/if}
</div>
