<script lang="ts">
  import {randomId} from "hurdak"
  import {toggleTheme, installPrompt, installAsPWA} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuMobileItem from "src/app/MenuMobileItem.svelte"
  import {slowConnections, menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {
    env,
    user,
    canSign,
    displayPerson,
    hasNewMessages,
    hasNewNotifications,
    pubkey,
    sessions,
    displayPubkey,
  } from "src/engine"

  const closeSubMenu = () => {
    subMenu = null
  }

  const closeMenu = () => {
    menuIsOpen.set(false)
    closeSubMenu()
  }

  const setSubMenu = name => {
    subMenu = name
  }

  const openSettings = e => {
    setSubMenu("settings")
  }

  const openAccount = e => {
    setSubMenu("account")
  }

  let subMenu
</script>

{#if $menuIsOpen}
  <SliderMenu onClick={closeMenu} onEscape={closeMenu}>
    <div class="m-auto max-w-[236px] py-8">
      {#if $pubkey}
        <Anchor
          stopPropagation
          class="flex items-center justify-center gap-2"
          on:click={openAccount}>
          <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
          <div class="flex min-w-0 flex-col">
            <span>@{displayPerson($user)}</span>
            <PersonHandle class="text-sm" pubkey={$pubkey} />
          </div>
        </Anchor>
      {:else}
        <div class="flex justify-center">
          <Anchor button accent modal href="/login/intro">Log In</Anchor>
        </div>
      {/if}
    </div>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      <MenuMobileItem stopPropagation on:click={openSettings}>
        <i class="fa fa-cog" /> Settings
      </MenuMobileItem>
      {#if $env.FORCE_RELAYS.length === 0}
        <MenuMobileItem href="/settings/relays">
          <i class="fa fa-server" />
          <div class="relative inline-block">
            Relays
            {#if $slowConnections.length > 0}
              <div
                class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
            {/if}
          </div>
        </MenuMobileItem>
      {/if}
      <MenuMobileItem disabled={!$pubkey} href="/notifications">
        <i class="fa fa-bell" />
        <div class="relative inline-block">
          Notifications
          {#if $hasNewNotifications}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      {#if $env.ENABLE_GROUPS}
        <MenuMobileItem href="/groups">
          <i class="fa fa-circle-nodes" /> Groups
        </MenuMobileItem>
      {/if}
      <MenuMobileItem disabled={!$canSign} href="/channels">
        <i class="fa fa-message" />
        <div class="relative inline-block">
          Messages
          {#if $hasNewMessages}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem on:click={() => router.at("notes").push({key: randomId()})}>
        <i class="fa fa-rss" /> Feed
      </MenuMobileItem>
    </div>
    <div class="staatliches mt-8 block flex h-8 justify-center gap-2 px-8 text-light">
      <Anchor class="hover:text-warm" href="/about">About</Anchor> /
      <Anchor external class="hover:text-warm" href="/terms.html">Terms</Anchor> /
      <Anchor external class="hover:text-warm" href="/privacy.html">Privacy</Anchor>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">Settings</p>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      {#if $installPrompt}
        <MenuMobileItem on:click={installAsPWA}>
          <i class="fa fa-rocket w-8" /> Install
        </MenuMobileItem>
      {/if}
      <MenuMobileItem on:click={toggleTheme}>
        <i class="fa fa-palette" /> Theme
      </MenuMobileItem>
      <MenuMobileItem disabled={!$pubkey} href="/settings/data">
        <i class="fa fa-database" /> Database
      </MenuMobileItem>
      <MenuMobileItem disabled={!$canSign} href="/settings/content">
        <i class="fa fa-volume-xmark" /> Content
      </MenuMobileItem>
      <MenuMobileItem disabled={!$canSign} href="/settings">
        <i class="fa fa-sliders" /> App Settings
      </MenuMobileItem>
      <MenuMobileItem disabled={!$canSign} stopPropagation on:click={openAccount}>
        <i class="fa fa-user-circle w-8" /> Edit Profile
      </MenuMobileItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "account"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">Account</p>
    <div class="staatliches m-auto mb-8 grid grid-cols-2 gap-3">
      <MenuMobileItem href="/settings/keys">
        <i class="fa fa-key" /> Keys
      </MenuMobileItem>
      <MenuMobileItem href={router.at("people").of($pubkey).toString()}>
        <i class="fa fa-user-circle" /> Profile
      </MenuMobileItem>
    </div>
    <div class="staatliches block flex h-8 justify-center gap-2 px-8 text-light">
      <Anchor class="hover:text-warm" href="/logout">Logout</Anchor> /
      <Anchor class="hover:text-warm" stopPropagation on:click={() => setSubMenu("accounts")}>
        Switch Accounts
      </Anchor>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "accounts"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
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
      class="staatliches py-4 text-center"
      on:click={() => router.at("login/advanced").open()}>
      <i class="fa fa-plus" /> Add Account
    </MenuItem>
  </SliderMenu>
{/if}
