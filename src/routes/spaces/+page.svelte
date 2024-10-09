<script lang="ts">
  import {goto} from '$app/navigation'
  import Icon from '@lib/components/Icon.svelte'
  import Page from '@lib/components/Page.svelte'
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

<Page>
  <div class="content column gap-4">
    <h1 class="superheading mt-20">Spaces</h1>
    <p class="text-center">Jump back in to your community, or find a new one</p>
    <div class="flex flex-col gap-2">
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
      <Button on:click={createSpace}>
        <CardButton>
          <div slot="icon"><Icon icon="add-circle" size={7} /></div>
          <div slot="title">Create a space</div>
          <div slot="info">Invite all your friends, do life together.</div>
        </CardButton>
      </Button>
      <Button on:click={browseSpaces}>
        <CardButton>
          <div slot="icon"><Icon icon="compass" size={7} /></div>
          <div slot="title">Discover spaces</div>
          <div slot="info">Find a community based on your hobbies or interests.</div>
        </CardButton>
      </Button>
    </div>
  </div>
</Page>
