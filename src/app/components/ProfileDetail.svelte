<script lang="ts">
  import {goto} from "$app/navigation"
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
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import WotScore from "@lib/components/WotScore.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import ChatEnable from "@app/components/ChatEnable.svelte"
  import {canDecrypt, pubkeyLink} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeChatPath} from "@app/routes"

  export type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()

  const relays = removeNil([url])
  const profile = deriveProfile(pubkey, relays)
  const display = deriveProfileDisplay(pubkey, relays)
  const handle = deriveHandleForPubkey(pubkey)
  const score = deriveUserWotScore(pubkey)

  const back = () => history.back()

  const chatPath = makeChatPath([pubkey])

  const openChat = () => ($canDecrypt ? goto(chatPath) : pushModal(ChatEnable, {next: chatPath}))

  const following = $derived(
    pubkey === $session!.pubkey || getPubkeyTagValues(getListTags($userFollows)).includes(pubkey),
  )
</script>

<div class="column gap-4">
  <div class="flex max-w-full gap-3">
    <span class="py-1">
      <Avatar src={$profile?.picture} size={10} />
    </span>
    <div class="flex min-w-0 flex-col">
      <div class="flex items-center gap-2">
        <span class="text-bold overflow-hidden text-ellipsis">
          {$display}
        </span>
        <WotScore score={$score} active={following} />
      </div>
      <div class="overflow-hidden text-ellipsis text-sm opacity-75">
        {$handle ? displayHandle($handle) : displayPubkey(pubkey)}
      </div>
    </div>
  </div>
  <ProfileInfo {pubkey} {url} />
  <ModalFooter>
    <Button onclick={back} class="btn btn-link">
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <div class="flex gap-2">
      <Link external href={pubkeyLink(pubkey)} class="btn btn-neutral">
        <Icon icon="user-circle" />
        See Complete Profile
      </Link>
      <Button onclick={openChat} class="btn btn-primary">
        <Icon icon="letter" />
        Open Chat
      </Button>
    </div>
  </ModalFooter>
</div>
