<script lang="ts">
  import {displayPubkey} from "@welshman/util"
  import {deriveProfile, deriveHandleForPubkey, displayHandle, deriveProfileDisplay, formatTimestamp} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
</script>

<div class="flex gap-2 max-w-full">
  <div class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </div>
  <div class="flex flex-col min-w-0">
    <div class="text-bold text-ellipsis overflow-hidden">
      {$profileDisplay}
    </div>
    <div class="text-sm opacity-75 text-ellipsis overflow-hidden">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
