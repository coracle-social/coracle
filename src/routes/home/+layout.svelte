<script lang="ts">
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import {chats} from '@app/state'
  import {pushModal} from '@app/modal'

  const startChat = () => pushModal(ChatStart)
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <div in:fly>
      <SecondaryNavItem href="/home">
        <Icon icon="home-smile" /> Home
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 50}}>
      <SecondaryNavItem href="/home/people">
        <Icon icon="user-heart" /> People
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 100}}>
      <SecondaryNavItem href="/home/notes">
        <Icon icon="notes-minimalistic" /> Notes
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 150}}>
      <SecondaryNavHeader>
        Chats
        <Button on:click={startChat}>
          <Icon icon="add-circle" />
        </Button>
      </SecondaryNavHeader>
    </div>
    {#each $chats as {id, pubkeys}, i (id)}
      <div in:fly={{delay: 200 + i * 50}}>
        <SecondaryNavItem href="/home/{id}">
          {id}
        </SecondaryNavItem>
      </div>
    {/each}
  </SecondaryNavSection>
</SecondaryNav>

<Page>
  <slot />
</Page>
