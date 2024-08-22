<script lang="ts">
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
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
        <Icon icon="clipboard-text" /> Saved Notes
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 150}}>
      <SecondaryNavHeader>
        Chats
        <div class="cursor-pointer">
          <Icon icon="add-circle" />
        </div>
      </SecondaryNavHeader>
    </div>
  </SecondaryNavSection>
</SecondaryNav>

<Page>
  <slot />
</Page>
