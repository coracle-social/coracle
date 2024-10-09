<script lang="ts">
  import {goto} from '$app/navigation'
  import Icon from '@lib/components/Icon.svelte'
  import Link from '@lib/components/Link.svelte'
  import Button from '@lib/components/Button.svelte'
  import CardButton from '@lib/components/CardButton.svelte'
  import LogOut from "@app/components/LogOut.svelte"
  import {pushModal} from "@app/modal"

  const back = () => history.back()

  const logout = () => pushModal(LogOut)
</script>

<div class="menu column gap-2">
  <Link href="/settings/profile">
    <CardButton>
      <div slot="icon"><Icon icon="user-circle" size={7} /></div>
      <div slot="title">Profile</div>
      <div slot="info">Customize your profile</div>
    </CardButton>
  </Link>
  <Link href="/settings/relays">
    <CardButton>
      <div slot="icon"><Icon icon="remote-controller-minimalistic" size={7} /></div>
      <div slot="title">Relays</div>
      <div slot="info">Control how Flotilla talks to the network</div>
    </CardButton>
  </Link>
  <Link href="/settings">
    <CardButton>
      <div slot="icon"><Icon icon="notes-minimalistic" size={7} /></div>
      <div slot="title">Settings</div>
      <div slot="info">Get into the details about how Flotilla works</div>
    </CardButton>
  </Link>
  <Link href="/settings/about">
    <CardButton>
      <div slot="icon"><Icon icon="chat-round" size={7} /></div>
      <div slot="title">About</div>
      <div slot="info">Learn about Flotilla and support the developer</div>
    </CardButton>
  </Link>
  <Button on:click={logout} class="btn btn-error">
    <Icon icon="exit" /> Log Out
  </Button>
</div>
