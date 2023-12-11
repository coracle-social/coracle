<script lang="ts">
  import {randomId} from "hurdak"
  import {toggleTheme, installPrompt, installAsPWA} from "src/partials/state"
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import MenuMobileItem from "src/app/MenuMobileItem.svelte"
  import {slowConnections, menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {
    env,
    canUseGiftWrap,
    hasNewNip24Messages,
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
    <div class="grid grid-cols-2 gap-x-8 gap-y-2 m-auto">
      {#if $installPrompt}
        <MenuMobileItem on:click={installAsPWA}>
          <i class="fa fa-rocket w-8" /> Install
        </MenuMobileItem>
      {/if}
      <MenuMobileItem external href="/terms.html">
        <i class="fa fa-scale-balanced w-8" /> Terms
      </MenuMobileItem>
      <MenuMobileItem external href="/privacy.html">
        <i class="fa fa-eye-slash w-8" /> Privacy
      </MenuMobileItem>
      <MenuMobileItem href="/about">
        <i class="fa fa-info-circle w-8" /> About
      </MenuMobileItem>
      <MenuMobileItem stopPropagation on:click={openSettings}>
        <i class="fa fa-cog w-8" /> Settings
      </MenuMobileItem>
      <MenuMobileItem stopPropagation on:click={openAccount}>
        <i class="fa fa-user-circle w-8" /> Account
      </MenuMobileItem>
      <div class="h-px bg-mid my-4 m-auto col-span-2" style="width: 200px;" />
      {#if $env.ENABLE_GROUPS}
        <MenuMobileItem disabled={!$canUseGiftWrap} href="/groups">
          <i class="fa fa-circle-nodes" /> Groups
        </MenuMobileItem>
      {/if}
      <MenuMobileItem href="/channels">
        <i class="fa fa-message" />
        <div class="relative inline-block">
          Messages
          {#if $hasNewNip24Messages}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem href="/notifications">
        <i class="fa fa-bell" />
        <div class="relative inline-block">
          Notifications
          {#if $hasNewNotifications}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
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
      <MenuMobileItem on:click={() => router.at("notes").push({key: randomId()})}>
        <i class="fa fa-rss" /> Feed
      </MenuMobileItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <p class="staatliches text-3xl mb-8">Settings</p>
    <div class="grid grid-cols-2 gap-x-8 gap-y-4 m-auto">
      <MenuMobileItem on:click={toggleTheme}>
        <i class="fa fa-palette" /> Theme
      </MenuMobileItem>
      <MenuMobileItem href="/settings/data">
        <i class="fa fa-database" /> Database
      </MenuMobileItem>
      <MenuMobileItem href="/settings/content">
        <i class="fa fa-volume-xmark" /> Content Settings
      </MenuMobileItem>
      <MenuMobileItem href="/settings">
        <i class="fa fa-cog" /> App Settings
      </MenuMobileItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "account"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <p class="staatliches text-3xl mb-8">Account</p>
    <div class="grid grid-cols-2 gap-x-8 gap-y-4 m-auto">
      <MenuMobileItem href="/logout">
        <i class="fa fa-right-to-bracket" /> Logout
      </MenuMobileItem>
      <MenuMobileItem stopPropagation on:click={() => setSubMenu("accounts")}>
        <i class="fa fa-right-left" /> Switch
      </MenuMobileItem>
      <MenuMobileItem href="/settings/keys">
        <i class="fa fa-key" /> Keys
      </MenuMobileItem>
      <MenuMobileItem href={router.at("people").of($pubkey).toString()}>
        <i class="fa fa-user-circle" /> Profile
      </MenuMobileItem>
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
    <MenuItem class="py-4" on:click={() => router.at("login/advanced").open()}>
      <i class="fa fa-plus" /> Add Account
    </MenuItem>
  </SliderMenu>
{/if}
