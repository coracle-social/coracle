<script lang="ts">
  import {goto} from "$app/navigation"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import {deriveGroup} from "@app/state"
  import {pushModal} from "@app/modal"
  import {removeGroupMemberships} from "@app/commands"

  export let nom

  const group = deriveGroup(nom)

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

  const leaveSpace = () => pushModal(SpaceExit, {nom})

  let showMenu = false
</script>

<SecondaryNavSection>
  <div>
    <SecondaryNavItem class="w-full !justify-between" on:click={openMenu}>
      <strong>{$group?.name || "[no name]"}</strong>
      <Icon icon="alt-arrow-down" />
    </SecondaryNavItem>
    {#if showMenu}
      <Popover onClose={toggleMenu}>
        <ul
          transition:fly|local
          class="menu absolute z-popover mt-2 w-full rounded-box bg-base-100 p-2 shadow-xl">
          <li class="text-error">
            <Button on:click={leaveSpace}>
              <Icon icon="exit" />
              Leave Space
            </Button>
          </li>
        </ul>
      </Popover>
    {/if}
  </div>
  <div class="h-2" />
  <SecondaryNavHeader>
    Rooms
    <div class="cursor-pointer">
      <Icon icon="add-circle" />
    </div>
  </SecondaryNavHeader>
  <div in:fly>
    <SecondaryNavItem href="/spaces">
      <Icon icon="hashtag" /> Spaces
    </SecondaryNavItem>
  </div>
  <div in:fly={{delay: 50}}>
    <SecondaryNavItem href="/themes">
      <Icon icon="hashtag" /> Themes
    </SecondaryNavItem>
  </div>
</SecondaryNavSection>
