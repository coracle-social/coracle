<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import LogOut from "@app/components/LogOut.svelte"
  import {PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"

  const logout = () => pushModal(LogOut)
</script>

<div class="column menu gap-2">
  <Link replaceState href="/settings/profile">
    <CardButton>
      <div slot="icon"><Icon icon="user-rounded" size={7} /></div>
      <div slot="title">Profile</div>
      <div slot="info">Customize your user profile</div>
    </CardButton>
  </Link>
  <Link replaceState href="/settings/relays">
    <CardButton>
      <div slot="icon"><Icon icon="server" size={7} /></div>
      <div slot="title">Relays</div>
      <div slot="info">Control how {PLATFORM_NAME} talks to the network</div>
    </CardButton>
  </Link>
  <Link replaceState href="/settings">
    <CardButton>
      <div slot="icon"><Icon icon="settings" size={7} /></div>
      <div slot="title">Settings</div>
      <div slot="info">Get into the details about how {PLATFORM_NAME} works</div>
    </CardButton>
  </Link>
  <Link replaceState href="/settings/about">
    <CardButton>
      <div slot="icon"><Icon icon="code-2" size={7} /></div>
      <div slot="title">About</div>
      <div slot="info">Learn about {PLATFORM_NAME} and support the developer</div>
    </CardButton>
  </Link>
  <Button on:click={logout} class="btn btn-neutral">
    <Icon icon="exit" /> Log Out
  </Button>
</div>
