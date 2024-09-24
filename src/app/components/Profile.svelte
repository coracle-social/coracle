<script lang="ts">
  import {displayPubkey} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestamp} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
</script>

<div class="flex gap-2">
  <div class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </div>
  <div class="flex flex-col">
    <div class="text-bold">{$profileDisplay}</div>
    <div class="text-sm opacity-75">{displayPubkey(pubkey)}</div>
  </div>
</div>
