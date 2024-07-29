<script lang="ts">
  import {makeScopeFeed, Scope} from "@welshman/feeds"
  import {toggleTheme, installPrompt, installAsPWA} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuMobileItem from "src/app/MenuMobileItem.svelte"
  import {slowConnections, menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"
  import {makeFeed, normalizeFeedDefinition} from "src/domain"
  import {
    env,
    canSign,
    hasNewMessages,
    hasNewNotifications,
    pubkey,
    sessions,
    displayProfileByPubkey,
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

  const openCommunity = e => {
    setSubMenu("community")
  }

  const openSettings = e => {
    setSubMenu("settings")
  }

  const openAccount = e => {
    setSubMenu("account")
  }

  const openFeeds = () => {
    const feed = makeFeed({definition: normalizeFeedDefinition(makeScopeFeed(Scope.Follows))})

    router.at("notes").cx({feed}).push()
    closeMenu()
  }

  let subMenu
</script>

{#if $menuIsOpen}
  <SliderMenu onEscape={closeMenu}>
    <div class="m-auto max-w-[236px] py-8">
      {#if $pubkey}
        <Anchor
          stopPropagation
          class="flex items-center justify-center gap-2"
          on:click={openAccount}>
          <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
          <div class="flex min-w-0 flex-col">
            <span>@{displayProfileByPubkey($pubkey)}</span>
            <PersonHandle class="text-sm" pubkey={$pubkey} />
          </div>
        </Anchor>
      {:else}
        <div class="flex justify-center">
          <Anchor button accent modal href="/login">Log In</Anchor>
        </div>
      {/if}
    </div>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      <MenuMobileItem stopPropagation on:click={openSettings}>
        <i class="fa fa-cog" /> Settings
      </MenuMobileItem>
      {#if !$env.FORCE_GROUP && $env.PLATFORM_RELAYS.length === 0}
        <MenuMobileItem href="/settings/relays" on:click={closeMenu}>
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
      <MenuMobileItem disabled={!$pubkey} href="/notifications" on:click={closeMenu}>
        <i class="fa fa-bell" />
        <div class="relative inline-block">
          Notifications
          {#if $hasNewNotifications}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      {#if $env.FORCE_GROUP}
        <MenuMobileItem href="/events" on:click={closeMenu}>
          <i class="fa fa-calendar-days" /> Calendar
        </MenuMobileItem>
        {#if $env.ENABLE_MARKET}
          <MenuMobileItem href="/listings" on:click={closeMenu}>
            <i class="fa fa-store" /> Market
          </MenuMobileItem>
        {/if}
      {:else}
        <MenuMobileItem stopPropagation on:click={openCommunity}>
          <i class="fa fa-people-pulling" /> Community
        </MenuMobileItem>
      {/if}
      <MenuMobileItem disabled={!$canSign} href="/channels" on:click={closeMenu}>
        <i class="fa fa-message" />
        <div class="relative inline-block">
          Messages
          {#if $hasNewMessages}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem on:click={openFeeds}>
        <i class="fa fa-rss" /> Feeds
      </MenuMobileItem>
    </div>
    <div class="staatliches mt-8 block flex h-8 justify-center gap-2 px-8 text-tinted-400">
      <Anchor class="hover:text-tinted-200" href="/about">About</Anchor> /
      <Anchor external class="hover:text-tinted-200" href="/terms.html">Terms</Anchor> /
      <Anchor external class="hover:text-tinted-200" href="/privacy.html">Privacy</Anchor>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "community"}
  <SliderMenu onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">Community</p>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      <MenuMobileItem href="/events" on:click={closeMenu}>
        <i class="fa fa-calendar-days" /> Calendar
      </MenuMobileItem>
      {#if $env.ENABLE_MARKET}
        <MenuMobileItem href="/listings" on:click={closeMenu}>
          <i class="fa fa-store" /> Market
        </MenuMobileItem>
      {/if}
      {#if !$env.FORCE_GROUP}
        <MenuMobileItem href="/groups" on:click={closeMenu}>
          <i class="fa fa-circle-nodes" /> Groups
        </MenuMobileItem>
      {/if}
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">Settings</p>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      {#if $installPrompt}
        <MenuMobileItem on:click={installAsPWA} on:click={closeMenu}>
          <i class="fa fa-rocket" /> Install
        </MenuMobileItem>
      {/if}
      <MenuMobileItem on:click={toggleTheme} on:click={closeMenu}>
        <i class="fa fa-palette" /> Theme
      </MenuMobileItem>
      <MenuMobileItem disabled={!$pubkey} href="/settings/data" on:click={closeMenu}>
        <i class="fa fa-database" /> Database
      </MenuMobileItem>
      <MenuMobileItem disabled={!$canSign} href="/settings/content" on:click={closeMenu}>
        <i class="fa fa-volume-xmark" /> Content
      </MenuMobileItem>
      <MenuMobileItem disabled={!$canSign} href="/settings" on:click={closeMenu}>
        <i class="fa fa-sliders" /> App Settings
      </MenuMobileItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "account"}
  <SliderMenu onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">Account</p>
    <div class="staatliches m-auto mb-8 grid grid-cols-2 gap-3">
      <MenuMobileItem href="/settings/keys" on:click={closeMenu}>
        <i class="fa fa-key" /> Keys
      </MenuMobileItem>
      <MenuMobileItem href={router.at("people").of($pubkey).toString()} on:click={closeMenu}>
        <i class="fa fa-user-circle" /> Profile
      </MenuMobileItem>
      <MenuMobileItem
        href={router.at("invite/create").qp({initialPubkey: $pubkey}).toString()}
        on:click={closeMenu}>
        <i class="fa fa-paper-plane" /> Create Invite
      </MenuMobileItem>
    </div>
    <div class="staatliches block flex h-8 justify-center gap-2 px-8 text-tinted-400">
      <Anchor class="hover:text-tinted-200" href="/logout" on:click={closeMenu}>Logout</Anchor> /
      <Anchor class="hover:text-tinted-200" stopPropagation on:click={() => setSubMenu("accounts")}>
        Switch Accounts
      </Anchor>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "accounts"}
  <SliderMenu onEscape={closeMenu}>
    {#each Object.values($sessions) as s (s.pubkey)}
      {#if s.pubkey !== $pubkey}
        <MenuItem class="py-4" on:click={() => pubkey.set(s.pubkey)}>
          <div class="flex items-center justify-center gap-2">
            <PersonCircle class="h-8 w-8 border border-solid border-tinted-200" pubkey={s.pubkey} />
            {displayProfileByPubkey(s.pubkey)}
          </div>
        </MenuItem>
      {/if}
    {/each}
    <MenuItem class="staatliches py-4 text-center" on:click={() => router.at("login").open()}>
      <i class="fa fa-plus" /> Add Account
    </MenuItem>
  </SliderMenu>
{/if}
