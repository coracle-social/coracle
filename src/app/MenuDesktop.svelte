<script lang="ts">
  import cx from "classnames"
  import {randomId} from "hurdak"
  import {toggleTheme} from "src/partials/state"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuDesktopItem from "src/app/MenuDesktopItem.svelte"
  import MenuDesktopSecondary from "src/app/MenuDesktopSecondary.svelte"
  import {slowConnections} from "src/app/state"
  import {router} from "src/app/router"
  import {
    env,
    user,
    hasNewMessages,
    hasNewNotifications,
    pubkey,
    sessions,
    displayPerson,
    displayPubkey,
  } from "src/engine"

  const {page} = router

  const closeSubMenu = () => {
    subMenu = null
  }

  const setSubMenu = name => {
    setTimeout(
      () => {
        subMenu = name
      },
      subMenu ? 100 : 0,
    )
  }

  const goToFeed = () => router.at("notes").push({key: randomId()})

  let subMenu, active

  $: {
    if ($page.path.startsWith("/notes")) {
      active = "feed"
    } else if ($page.path.startsWith("/notifications")) {
      active = "notifications"
    } else if ($page.path.startsWith("/channels")) {
      active = "channels"
    }
  }
</script>

<div class={cx("fixed bottom-0 left-0 top-0 w-60 bg-cocoa transition-colors")}>
  <Anchor
    class="mb-4 flex h-16 items-center gap-1 px-6"
    external
    href="https://info.coracle.social">
    <img alt="App Logo" src={import.meta.env.VITE_LOGO_URL || "/images/logo.png"} class="w-10" />
    <h1 class="staatliches text-3xl">Coracle</h1>
  </Anchor>
  <MenuDesktopItem path="/notes" on:click={goToFeed}>Feed</MenuDesktopItem>
  {#if $env.FORCE_RELAYS.length === 0}
    <MenuDesktopItem path="/settings/relays">
      <div class="relative inline-block">
        Relays
        {#if $slowConnections.length > 0}
          <div
            class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </div>
    </MenuDesktopItem>
  {/if}
  <MenuDesktopItem path="/notifications">
    <div class="relative inline-block">
      Notifications
      {#if $hasNewNotifications}
        <div
          class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>
  <MenuDesktopItem path="/channels">
    <div class="relative inline-block">
      Messages
      {#if $hasNewMessages}
        <div
          class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>
  {#if $env.ENABLE_GROUPS}
    <MenuDesktopItem path="/groups">Groups</MenuDesktopItem>
  {/if}
  <FlexColumn small class="absolute bottom-0 w-60">
    <MenuDesktopItem on:click={() => setSubMenu("settings")}>Settings</MenuDesktopItem>
    <div class="staatliches block flex h-8 gap-2 px-8 text-light">
      <Anchor class="hover:text-warm" href="/about">About</Anchor> /
      <Anchor external class="hover:text-warm" href="/terms.html">Terms</Anchor> /
      <Anchor external class="hover:text-warm" href="/privacy.html">Privacy</Anchor>
    </div>
    {#if subMenu === "settings"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" on:click={toggleTheme}>
          <i class="fa fa-palette" /> Toggle Theme
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/settings">
          <i class="fa fa-cog" /> App Settings
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/settings/content">
          <i class="fa fa-volume-xmark" /> Content Settings
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/settings/data">
          <i class="fa fa-database" /> Database
        </MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "account"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href={router.at("people").of($pubkey).toString()}>
          <i class="fa fa-user-circle" /> Profile
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/settings/keys">
          <i class="fa fa-key" /> Keys
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          on:click={() => setSubMenu("accounts")}>
          <i class="fa fa-right-left" /> Switch Account
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/logout">
          <i class="fa fa-right-to-bracket" /> Log Out
        </MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "accounts"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        {#each Object.values($sessions) as s (s.pubkey)}
          {#if s.pubkey !== $pubkey}
            <MenuItem class="py-4" on:click={() => pubkey.set(s.pubkey)}>
              <div class="flex items-center justify-center gap-2">
                <PersonCircle class="h-8 w-8 border border-solid border-warm" pubkey={s.pubkey} />
                {displayPubkey(s.pubkey)}
              </div>
            </MenuItem>
          {/if}
        {/each}
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          on:click={() => router.at("login/advanced").open()}>
          <i class="fa fa-plus" /> Add Account
        </MenuItem>
      </MenuDesktopSecondary>
    {/if}
    <div class="cursor-pointer border-t border-solid border-mid px-7 pb-4 pt-3">
      {#if $user}
        <Anchor class="flex items-center gap-2" on:click={() => setSubMenu("account")}>
          <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
          <div class="flex min-w-0 flex-col">
            <span>@{displayPerson($user)}</span>
            <PersonHandle class="text-sm" pubkey={$pubkey} />
          </div>
        </Anchor>
      {:else}
        <Anchor modal button accent href="/login/intro">Log In</Anchor>
      {/if}
    </div>
  </FlexColumn>
</div>
