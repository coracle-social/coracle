<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import ProfileLink from "@app/components/ProfileLink.svelte"

  type Props = {
    event: TrustedEvent
  }

  const {event}: Props = $props()
  const meta = $derived(fromPairs(event.tags) as Record<string, string>)
</script>

<span>
  Posted by <ProfileLink pubkey={event.pubkey} />
</span>
{#if meta.location}
  <span>•</span>
  <span class="flex items-center gap-1">
    <Icon icon="map-point" size={4} />
    {meta.location}
  </span>
{/if}
