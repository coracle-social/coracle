<script lang="ts">
  import {displayPubkey, getPubkeyTagValues, getListTags} from "@welshman/util"
  import {
    userFollows,
    deriveUserWotScore,
    deriveProfile,
    deriveHandleForPubkey,
    displayHandle,
    deriveProfileDisplay,
  } from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@lib/components/WotScore.svelte"

  export let value

  const pubkey = value
  const profile = deriveProfile(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const score = deriveUserWotScore(pubkey)

  $: following = getPubkeyTagValues(getListTags($userFollows)).includes(pubkey)
</script>

<div class="flex max-w-full gap-3">
  <div class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </div>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <div class="text-bold overflow-hidden text-ellipsis">
        {$profileDisplay}
      </div>
      <WotScore score={$score} active={following} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
