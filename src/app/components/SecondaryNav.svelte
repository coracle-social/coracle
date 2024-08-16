<script lang="ts">
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SecondaryNavForSpace from "@app/components/SecondaryNavForSpace.svelte"
  import {getPrimaryNavItem} from "@app/routes"
</script>

<div class="flex w-60 flex-col gap-1 bg-base-300">
  {#if getPrimaryNavItem($page) === "discover"}
    <SecondaryNavSection>
      <div in:fly>
        <SecondaryNavItem href="/spaces">
          <Icon icon="widget" /> Spaces
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: 50}}>
        <SecondaryNavItem href="/themes">
          <Icon icon="pallete-2" /> Themes
        </SecondaryNavItem>
      </div>
    </SecondaryNavSection>
  {:else if getPrimaryNavItem($page) === "space"}
    {#key $page.params.nom}
      <SecondaryNavForSpace nom={$page.params.nom} />
    {/key}
  {:else if getPrimaryNavItem($page) === "settings"}
    <!-- pass -->
  {:else}
    <SecondaryNavSection>
      <div in:fly>
        <SecondaryNavItem href="/home">
          <Icon icon="home-smile" /> Home
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: 50}}>
        <SecondaryNavItem href="/people">
          <Icon icon="user-heart" /> People
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: 100}}>
        <SecondaryNavItem href="/notes">
          <Icon icon="clipboard-text" /> Saved Notes
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: 150}}>
        <SecondaryNavHeader>
          Conversations
          <div class="cursor-pointer">
            <Icon icon="add-circle" />
          </div>
        </SecondaryNavHeader>
      </div>
    </SecondaryNavSection>
  {/if}
</div>
