<script lang="ts">
  import {removeNil} from "@welshman/lib"
  import {displayPubkey, getPubkeyTagValues, getListTags} from "@welshman/util"
  import {
    session,
    userFollows,
    deriveUserWotScore,
    deriveHandleForPubkey,
    displayHandle,
    deriveProfile,
    deriveProfileDisplay,
  } from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@lib/components/WotScore.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const relays = removeNil([url])
  const profile = deriveProfile(pubkey, relays)
  const profileDisplay = deriveProfileDisplay(pubkey, relays)
  const handle = deriveHandleForPubkey(pubkey)
  const score = deriveUserWotScore(pubkey)

  const openProfile = () => pushModal(ProfileDetail, {pubkey, url})

  const following = $derived(
    pubkey === $session!.pubkey || getPubkeyTagValues(getListTags($userFollows)).includes(pubkey),
  )
</script>

<div class="flex max-w-full gap-3">
  <Button onclick={openProfile} class="py-1">
    <Avatar src={$profile?.picture} size={10} />
  </Button>
  <div class="flex min-w-0 flex-col">
    <div class="flex items-center gap-2">
      <Button onclick={openProfile} class="text-bold overflow-hidden text-ellipsis">
        {$profileDisplay}
      </Button>
      <WotScore score={$score} active={following} />
    </div>
    <div class="overflow-hidden text-ellipsis text-sm opacity-75">
      {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
    </div>
  </div>
</div>
