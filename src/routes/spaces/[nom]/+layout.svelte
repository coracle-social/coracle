<script lang="ts">
  import {page} from "$app/stores"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import {deriveGroup, userMembership, displayGroup} from "@app/state"
  import {pushModal} from "@app/modal"

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

  const leaveSpace = () => pushModal(SpaceExit, {nom})

  const joinSpace = () => pushModal(SpaceJoin, {nom})

  let showMenu = false

  $: nom = $page.params.nom
  $: group = deriveGroup(nom)
</script>

{#key nom}
  <SecondaryNav>
    <SecondaryNavSection>
      <div>
        <SecondaryNavItem class="w-full !justify-between" on:click={openMenu}>
          <strong>{displayGroup($group)}</strong>
          <Icon icon="alt-arrow-down" />
        </SecondaryNavItem>
        {#if showMenu}
          <Popover hideOnClick onClose={toggleMenu}>
            <ul
              transition:fly|local
              class="menu absolute z-popover mt-2 w-full rounded-box bg-base-100 p-2 shadow-xl">
              {#if $userMembership?.noms.has(nom)}
                <li class="text-error">
                  <Button on:click={leaveSpace}>
                    <Icon icon="exit" />
                    Leave Space
                  </Button>
                </li>
              {:else}
                <li>
                  <Button on:click={joinSpace}>
                    <Icon icon="login-2" />
                    Join Space
                  </Button>
                </li>
              {/if}
            </ul>
          </Popover>
        {/if}
      </div>
      <div class="my-3 h-px bg-base-200" />
      <div in:fly|local>
        <SecondaryNavItem href="/spaces/{nom}">
          <Icon icon="chat-round" /> Chat
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 50}}>
        <SecondaryNavItem href="/spaces/{nom}/threads">
          <Icon icon="notes-minimalistic" /> Threads
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 100}}>
        <SecondaryNavItem href="/spaces/{nom}/events">
          <Icon icon="calendar-minimalistic" /> Calendar
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 150}}>
        <SecondaryNavItem href="/spaces/{nom}/listings">
          <Icon icon="shop-minimalistic" /> Market
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 200}}>
        <div class="h-2" />
        <SecondaryNavHeader>
          Rooms
          <Button on:click={() => alert("Uh, I don't know how to do rooms on NIP 29")}>
            <Icon icon="add-circle" />
          </Button>
        </SecondaryNavHeader>
      </div>
    </SecondaryNavSection>
  </SecondaryNav>
  <Page>
    <slot />
  </Page>
{/key}
