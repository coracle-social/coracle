<script lang="ts">
  import {displayPubkey} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestamp} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"
  import Profile from "@app/components/Profile.svelte"

  export let event
</script>

<div class="flex flex-col gap-2 {$$props.class}">
  <div class="flex justify-between gap-2">
    <Profile pubkey={event.pubkey} />
    <span class="text-sm opacity-75">{formatTimestamp(event.created_at)}</span>
  </div>
  <slot />
</div>
