<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {derived} from 'svelte/store'
  import {displayPubkey, getListValues} from "@welshman/util"
  import {userFollows, deriveUserWotScore, deriveProfile, deriveHandleForPubkey, displayHandle, deriveProfileDisplay, formatTimestamp, getUserWotScore, followsByPubkey} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@lib/components/WotScore.svelte"
  import {entityLink} from '@app/state'

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const profile = deriveProfile(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const score = deriveUserWotScore(pubkey)

  $: following = getListValues("p", $userFollows).includes(pubkey)
</script>

<div class="flex gap-3 max-w-full">
  <Link external href={entityLink(npub)} class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </Link>
  <div class="flex flex-col min-w-0">
    <div class="flex gap-2 items-center">
      <Link external class="text-bold text-ellipsis overflow-hidden" href={entityLink(npub)}>
        {$profileDisplay}
      </Link>
      <WotScore score={$score} active={following} />
    </div>
    <div class="text-sm opacity-75 text-ellipsis overflow-hidden">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
