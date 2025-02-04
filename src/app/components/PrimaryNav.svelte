<script lang="ts">
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {userProfile} from "@welshman/app"
  import Avatar from "@lib/components/Avatar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import ChatEnable from "@app/components/ChatEnable.svelte"
  import MenuSpaces from "@app/components/MenuSpaces.svelte"
  import MenuSettings from "@app/components/MenuSettings.svelte"
  import PrimaryNavItemSpace from "@app/components/PrimaryNavItemSpace.svelte"
  import {userRoomsByUrl, canDecrypt, PLATFORM_RELAY, PLATFORM_LOGO} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"
  import {notifications} from "@app/notifications"
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()

  const addSpace = () => pushModal(SpaceAdd)

  const showSpacesMenu = () => (spacePaths.length > 0 ? pushModal(MenuSpaces) : pushModal(SpaceAdd))

  const showSettingsMenu = () => pushModal(MenuSettings)

  const openChat = () => ($canDecrypt ? goto("/chat") : pushModal(ChatEnable, {next: "/chat"}))

  const spaceUrls = $derived(Array.from($userRoomsByUrl.keys()))
  const spacePaths = $derived(spaceUrls.map(url => makeSpacePath(url)))
  const anySpaceNotifications = $derived(
    spacePaths.some(path => !$page.url.pathname.startsWith(path) && $notifications.has(path)),
  )
</script>

<div class="sail sait saib relative z-nav hidden w-14 flex-shrink-0 bg-base-200 pt-4 md:block">
  <div class="flex h-full flex-col justify-between">
    <div>
      {#if PLATFORM_RELAY}
        <PrimaryNavItemSpace url={PLATFORM_RELAY} />
      {:else}
        <PrimaryNavItem title="Home" href="/home" class="tooltip-right">
          <Avatar src={PLATFORM_LOGO} class="!h-10 !w-10" />
        </PrimaryNavItem>
        <Divider />
        {#each spaceUrls as url (url)}
          <PrimaryNavItemSpace {url} />
        {/each}
        <PrimaryNavItem title="Add Space" onclick={addSpace} class="tooltip-right">
          <Avatar icon="settings-minimalistic" class="!h-10 !w-10" />
        </PrimaryNavItem>
      {/if}
    </div>
    <div>
      <PrimaryNavItem
        title="Settings"
        href="/settings/profile"
        prefix="/settings"
        class="tooltip-right">
        <Avatar src={$userProfile?.picture} class="!h-10 !w-10" />
      </PrimaryNavItem>
      <PrimaryNavItem
        title="Messages"
        onclick={openChat}
        class="tooltip-right"
        notification={$notifications.has("/chat")}>
        <Avatar icon="letter" class="!h-10 !w-10" />
      </PrimaryNavItem>
      <PrimaryNavItem title="Search" href="/people" class="tooltip-right">
        <Avatar icon="magnifer" class="!h-10 !w-10" />
      </PrimaryNavItem>
    </div>
  </div>
</div>

{@render children?.()}

<!-- a little extra something for ios -->
<div class="fixed bottom-0 left-0 right-0 z-nav h-14 bg-base-100 md:hidden"></div>
<div
  class="border-top bottom-sai fixed left-0 right-0 z-nav h-14 border border-base-200 bg-base-100 md:hidden">
  <div class="content-padding-x content-sizing flex justify-between px-2">
    <div class="flex gap-2 sm:gap-8">
      <PrimaryNavItem title="Home" href="/home">
        <Avatar icon="home-smile" class="!h-10 !w-10" />
      </PrimaryNavItem>
      <PrimaryNavItem
        title="Messages"
        onclick={openChat}
        notification={$notifications.has("/chat")}>
        <Avatar icon="letter" class="!h-10 !w-10" />
      </PrimaryNavItem>
      <PrimaryNavItem title="Spaces" onclick={showSpacesMenu} notification={anySpaceNotifications}>
        <Avatar icon="settings-minimalistic" class="!h-10 !w-10" />
      </PrimaryNavItem>
    </div>
    <PrimaryNavItem title="Settings" onclick={showSettingsMenu}>
      <Avatar icon="settings" src={$userProfile?.picture} class="!h-10 !w-10" />
    </PrimaryNavItem>
  </div>
</div>
