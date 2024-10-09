<script lang="ts">
  import {goto} from '$app/navigation'
  import Icon from '@lib/components/Icon.svelte'
  import Link from '@lib/components/Link.svelte'
  import Button from '@lib/components/Button.svelte'
  import Divider from '@lib/components/Divider.svelte'
  import CardButton from '@lib/components/CardButton.svelte'
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import {userMembership, getMembershipUrls} from "@app/state"
  import {makeSpacePath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const createSpace = () => pushModal(SpaceCreateExternal)

  const browseSpaces = () => goto("/discover")
</script>

<div class="menu column gap-2">
  <Link href="/home/people">
    <CardButton>
      <div slot="icon"><Icon icon="user-heart" size={7} /></div>
      <div slot="title">People</div>
      <div slot="info">Search for people on the network</div>
    </CardButton>
  </Link>
  <Link href="/home/network">
    <CardButton>
      <div slot="icon"><Icon icon="share-circle" size={7} /></div>
      <div slot="title">Network</div>
      <div slot="info">Browse posts from your network</div>
    </CardButton>
  </Link>
  <Link href="/home/notes">
    <CardButton>
      <div slot="icon"><Icon icon="notes-minimalistic" size={7} /></div>
      <div slot="title">Notes</div>
      <div slot="info">Keep track of your notes</div>
    </CardButton>
  </Link>
  <Link href="/home/chats">
    <CardButton>
      <div slot="icon"><Icon icon="chat-round" size={7} /></div>
      <div slot="title">Chats</div>
      <div slot="info">Keep in touch with encrypted chat</div>
    </CardButton>
  </Link>
</div>
