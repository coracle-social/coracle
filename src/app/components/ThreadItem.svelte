<script lang="ts">
  import {displayPubkey} from "@welshman/util"
  import {deriveProfile, deriveProfileDisplay, formatTimestamp} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"

  export let root
  export let replies

  const profile = deriveProfile(root.pubkey)
  const profileDisplay = deriveProfileDisplay(root.pubkey)
</script>

<div>
  <div class="card2 flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-2">
        <div class="py-1">
          <Avatar src={$profile?.picture} size={10} />
        </div>
        <div class="flex flex-col">
          <div class="text-bold">{$profileDisplay}</div>
          <div class="text-sm opacity-75">{displayPubkey(root.pubkey)}</div>
        </div>
      </div>
      <span class="text-sm opacity-75">{formatTimestamp(root.created_at)}</span>
    </div>
    <div class="ml-12"></div>
  </div>
  {#if replies.length > 0}
    Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
  {/if}
</div>
