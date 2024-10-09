<script lang="ts">
  import {page} from "$app/stores"
  import {displayRelayUrl} from "@welshman/util"
  import {userProfile} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import MenuHome from "@app/components/MenuHome.svelte"
  import MenuSpaces from "@app/components/MenuSpaces.svelte"
  import MenuSettings from "@app/components/MenuSettings.svelte"
  import {userMembership, getMembershipUrls} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeSpacePath, getPrimaryNavItemIndex} from "@app/routes"

  const addSpace = () => pushModal(SpaceAdd)

  const showHomeMenu = () => pushModal(MenuHome)

  const showSpacesMenu = () => pushModal(MenuSpaces)

  const showSettingsMenu = () => pushModal(MenuSettings)
</script>

<div class="relative w-14 flex-shrink-0 bg-base-100 pt-4 hidden sm:block">
  <div class="flex h-full flex-col justify-between">
    <div>
      <PrimaryNavItem href="/home" class="tooltip-right">
        <Avatar src={$userProfile?.picture} class="!h-10 !w-10" />
      </PrimaryNavItem>
      {#each getMembershipUrls($userMembership) as url (url)}
        <PrimaryNavItem title={displayRelayUrl(url)} href={makeSpacePath(url)} class="tooltip-right">
          <SpaceAvatar {url} />
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space" on:click={addSpace} class="tooltip-right">
        <Avatar icon="add-circle" class="!h-10 !w-10" />
      </PrimaryNavItem>
      <PrimaryNavItem title="Discover Spaces" href="/discover" class="tooltip-right">
        <Avatar icon="compass-big" class="!h-10 !w-10" />
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings" href="/settings/profile" class="tooltip-right">
        <Avatar icon="settings" class="!h-10 !w-10" />
      </PrimaryNavItem>
    </div>
  </div>
</div>

<slot />

<div class="fixed bottom-0 left-0 right-0 h-14 bg-base-100 sm:hidden z-nav">
  <div class="flex justify-between max-w-sm m-auto px-2">
    <PrimaryNavItem title="Home" on:click={showHomeMenu}>
      <Avatar icon="home-smile" class="!h-10 !w-10" />
    </PrimaryNavItem>
    <PrimaryNavItem title="Spaces" on:click={showSpacesMenu}>
      <SpaceAvatar />
    </PrimaryNavItem>
    <PrimaryNavItem title="Settings" on:click={showSettingsMenu}>
      <Avatar icon="settings" class="!h-10 !w-10" />
    </PrimaryNavItem>
  </div>
</div>
