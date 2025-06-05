<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {removeNil} from "@welshman/lib"
  import {displayPubkey} from "@welshman/util"
  import {
    deriveHandleForPubkey,
    displayHandle,
    deriveProfile,
    deriveProfileDisplay,
  } from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@app/components/WotScore.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"
  import {clip} from "@app/toast"

  type Props = {
    pubkey: string
    url?: string
    showPubkey?: boolean
    avatarSize?: number
  }

  const {pubkey, url, showPubkey, avatarSize = 10}: Props = $props()

  const relays = removeNil([url])
  const profile = deriveProfile(pubkey, relays)
  const profileDisplay = deriveProfileDisplay(pubkey, relays)
  const handle = deriveHandleForPubkey(pubkey)

  const openProfile = () => pushModal(ProfileDetail, {pubkey, url})

  const copyPubkey = () => clip(nip19.npubEncode(pubkey))
</script>

<div class="flex max-w-full items-start gap-3">
  <Button onclick={openProfile} class="py-1">
    <Avatar src={$profile?.picture} size={avatarSize} />
  </Button>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <Button onclick={openProfile} class="text-bold overflow-hidden text-ellipsis">
        {$profileDisplay}
      </Button>
      <WotScore {pubkey} />
    </div>
    {#if $handle}
      <div class="overflow-hidden text-ellipsis text-sm opacity-75">
        {displayHandle($handle)}
      </div>
    {/if}
    {#if showPubkey}
      <div class="flex items-center gap-1 overflow-hidden text-ellipsis text-xs opacity-60">
        {displayPubkey(pubkey)}
        <Button onclick={copyPubkey} class="pt-1">
          <Icon size={3} icon="copy" />
        </Button>
      </div>
    {/if}
  </div>
</div>
