<script lang="ts">
  import {goto} from "$app/navigation"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import Profile from "@app/components/Profile.svelte"
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

  const back = () => history.back()

  const chatPath = makeChatPath([pubkey])

  const openChat = () => ($canDecrypt ? goto(chatPath) : pushModal(ChatEnable, {next: chatPath}))
</script>

<div class="column gap-4">
  <Profile showPubkey avatarSize={14} {pubkey} {url} />
  <ProfileInfo {pubkey} {url} />
  <ModalFooter>
    <Button onclick={back} class="hidden md:btn md:btn-link">
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
