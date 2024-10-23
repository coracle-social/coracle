<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import {userMembership, getMembershipUrls, PLATFORM_RELAY} from "@app/state"
  import {makeSpacePath} from "@app/routes"
  import {pushModal} from "@app/modal"

  const addSpace = () => pushModal(SpaceAdd)
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
  {:else if getMembershipUrls($userMembership).length > 0}
    {#each getMembershipUrls($userMembership) as url (url)}
      <Link href={makeSpacePath(url)}>
        <CardButton>
          <div slot="icon"><SpaceAvatar {url} /></div>
          <div slot="title"><RelayName {url} /></div>
          <div slot="info"><RelayDescription {url} /></div>
        </CardButton>
      </Link>
    {/each}
    <Divider />
  {/if}
  <Button on:click={addSpace}>
    <CardButton>
      <div slot="icon"><Icon icon="login-2" size={7} /></div>
      <div slot="title">Add a space</div>
      <div slot="info">Join or create a new space</div>
    </CardButton>
  </Button>
</div>
