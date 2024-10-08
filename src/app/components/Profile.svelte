<script lang="ts">
  import {nip19} from "nostr-tools"
  import {displayPubkey, getPubkeyTagValues, getListTags} from "@welshman/util"
  import {
    userFollows,
    deriveUserWotScore,
    deriveProfile,
    deriveHandleForPubkey,
    displayHandle,
    deriveProfileDisplay,
  } from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@lib/components/WotScore.svelte"
  import {entityLink} from "@app/state"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const profile = deriveProfile(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const score = deriveUserWotScore(pubkey)

  $: following = getPubkeyTagValues(getListTags($userFollows)).includes(pubkey)
</script>

<div class="flex max-w-full gap-3">
  <Link external href={entityLink(npub)} class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </Link>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <Link external class="text-bold overflow-hidden text-ellipsis" href={entityLink(npub)}>
        {$profileDisplay}
      </Link>
      <WotScore score={$score} active={following} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
