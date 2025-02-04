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
      {#snippet icon()}
        <div><Icon icon="user-rounded" size={7} /></div>
      {/snippet}
      {#snippet title()}
        <div>Profile</div>
      {/snippet}
      {#snippet info()}
        <div>Customize your user profile</div>
      {/snippet}
    </CardButton>
  </Link>
  <Link replaceState href="/settings/relays">
    <CardButton>
      {#snippet icon()}
        <div><Icon icon="server" size={7} /></div>
      {/snippet}
      {#snippet title()}
        <div>Relays</div>
      {/snippet}
      {#snippet info()}
        <div>Control how {PLATFORM_NAME} talks to the network</div>
      {/snippet}
    </CardButton>
  </Link>
  <Link replaceState href="/settings">
    <CardButton>
      {#snippet icon()}
        <div><Icon icon="settings" size={7} /></div>
      {/snippet}
      {#snippet title()}
        <div>Settings</div>
      {/snippet}
      {#snippet info()}
        <div>Get into the details about how {PLATFORM_NAME} works</div>
      {/snippet}
    </CardButton>
  </Link>
  <Link replaceState href="/settings/about">
    <CardButton>
      {#snippet icon()}
        <div><Icon icon="code-2" size={7} /></div>
      {/snippet}
      {#snippet title()}
        <div>About</div>
      {/snippet}
      {#snippet info()}
        <div>Learn about {PLATFORM_NAME} and support the developer</div>
      {/snippet}
    </CardButton>
  </Link>
  <Button onclick={logout} class="btn btn-neutral">
    <Icon icon="exit" /> Log Out
  </Button>
</div>
