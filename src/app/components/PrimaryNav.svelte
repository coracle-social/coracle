<script lang="ts">
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
  import {makeSpacePath} from "@app/routes"

  const addSpace = () => pushModal(SpaceAdd)

  const showHomeMenu = () => pushModal(MenuHome)

  const showSpacesMenu = () => pushModal(MenuSpaces)

  const showSettingsMenu = () => pushModal(MenuSettings)
</script>

{#if import.meta.env.VITE_PLATFORM_RELAY}
  <div class="relative hidden w-14 flex-shrink-0 bg-base-100 pt-4 md:block">
    <div class="flex h-full flex-col justify-between">
      <div>
        <PrimaryNavItem href="/home/people" class="tooltip-right">
          <Avatar icon="home-smile" class="!h-10 !w-10" />
        </PrimaryNavItem>
        <PrimaryNavItem
          title={displayRelayUrl(import.meta.env.VITE_PLATFORM_RELAY)}
          href={makeSpacePath(import.meta.env.VITE_PLATFORM_RELAY)}
          class="tooltip-right">
          <SpaceAvatar url={import.meta.env.VITE_PLATFORM_RELAY} />
        </PrimaryNavItem>
      </div>
      <div>
        <PrimaryNavItem title="Profile" href="/settings/profile" class="tooltip-right">
          <Avatar src={$userProfile?.picture} class="!h-10 !w-10" />
        </PrimaryNavItem>
        <PrimaryNavItem title="Settings" href="/settings/relays" class="tooltip-right">
          <Avatar icon="settings" class="!h-10 !w-10" />
        </PrimaryNavItem>
      </div>
    </div>
  </div>
{:else}
  <div class="relative hidden w-14 flex-shrink-0 bg-base-100 pt-4 md:block">
    <div class="flex h-full flex-col justify-between">
      <div>
        <PrimaryNavItem href="/home/people" class="tooltip-right">
          <Avatar icon="home-smile" class="!h-10 !w-10" />
        </PrimaryNavItem>
        {#each getMembershipUrls($userMembership) as url (url)}
          <PrimaryNavItem
            title={displayRelayUrl(url)}
            href={makeSpacePath(url)}
            class="tooltip-right">
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
        <PrimaryNavItem title="Profile" href="/settings/profile" class="tooltip-right">
          <Avatar src={$userProfile?.picture} class="!h-10 !w-10" />
        </PrimaryNavItem>
        <PrimaryNavItem title="Settings" href="/settings/relays" class="tooltip-right">
          <Avatar icon="settings" class="!h-10 !w-10" />
        </PrimaryNavItem>
      </div>
    </div>
  </div>
{/if}

<slot />

<div
  class="border-top fixed bottom-0 left-0 right-0 z-nav h-14 border border-base-200 bg-base-100 md:hidden">
  <div class="m-auto flex max-w-md justify-between px-2">
    <div class="flex gap-4 sm:gap-8">
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
    <PrimaryNavItem noActive title="Settings" href="/settings/profile">
      <Avatar src={$userProfile?.picture} class="!h-10 !w-10" />
    </PrimaryNavItem>
  </div>
</div>
