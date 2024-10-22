<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import SpaceInviteAccept from "@app/components/SpaceInviteAccept.svelte"
  import {userMembership, getMembershipUrls, PLATFORM_RELAY} from "@app/state"
  import {makeSpacePath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const startCreate = () => pushModal(SpaceCreateExternal)

  const startJoin = () => pushModal(SpaceInviteAccept)
</script>

<div class="column menu gap-2">
  {#if PLATFORM_RELAY}
    <Link href={makeSpacePath(PLATFORM_RELAY)}>
      <CardButton>
        <div slot="icon"><SpaceAvatar url={PLATFORM_RELAY} /></div>
        <div slot="title"><RelayName url={PLATFORM_RELAY} /></div>
        <div slot="info"><RelayDescription url={PLATFORM_RELAY} /></div>
      </CardButton>
    </Link>
    <Divider />
  {:else}
    {#each getMembershipUrls($userMembership) as url (url)}
      <Link href={makeSpacePath(url)}>
        <CardButton>
          <div slot="icon"><SpaceAvatar {url} /></div>
          <div slot="title"><RelayName {url} /></div>
          <div slot="info"><RelayDescription {url} /></div>
        </CardButton>
      </Link>
    {/each}
    {#if getMembershipUrls($userMembership).length > 0}
      <Divider />
    {/if}
  {/if}
  <Button on:click={startJoin}>
    <CardButton>
      <div slot="icon"><Icon icon="login-2" size={7} /></div>
      <div slot="title">Join a space</div>
      <div slot="info">Enter an invite code or url to join an existing space.</div>
    </CardButton>
  </Button>
  <Link href="/discover">
    <CardButton>
      <div slot="icon"><Icon icon="compass" size={7} /></div>
      <div slot="title">Find a space</div>
      <div slot="info">Browse spaces on the discover page.</div>
    </CardButton>
  </Link>
  <Button on:click={startCreate}>
    <CardButton>
      <div slot="icon"><Icon icon="add-circle" size={7} /></div>
      <div slot="title">Create a space</div>
      <div slot="info">Just a few questions and you'll be on your way.</div>
    </CardButton>
  </Button>
</div>
