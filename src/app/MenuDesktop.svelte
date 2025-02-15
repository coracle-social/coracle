<script lang="ts">
  import {now, omit, MINUTE} from "@welshman/lib"
  import { i18n } from './stores/i18nStore'
  import {seconds} from "hurdak"
  import {derived, get} from "svelte/store"
  import {LOCAL_RELAY_URL} from "@welshman/util"
  import {PublishStatus} from "@welshman/net"
  import {
    signer,
    pubkey,
    sessions,
    deriveProfileDisplay,
    displayProfileByPubkey,
    thunks,
    type Thunk,
  } from "@welshman/app"
  import {toggleTheme, theme} from "src/partials/state"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuDesktopItem from "src/app/MenuDesktopItem.svelte"
  import MenuDesktopSecondary from "src/app/MenuDesktopSecondary.svelte"
  import {slowConnections} from "src/app/state"
  import {router} from "src/app/util/router"
  import {env, hasNewMessages, hasNewNotifications} from "src/engine"
  import LanguageSelector from './shared/LanguageSelector.svelte'
  import OpenTranslationsButton from './i18n/OpenTranslationsButton.svelte'
import { writable } from 'svelte/store'
import { isSidebarCollapsed } from './stores/sidebarStore'
  const {page} = router


  $: recent = (Object.values($thunks) as Thunk[]).filter(
    t => t.event.created_at > now() - 5 * MINUTE && t.event.pubkey === $pubkey,
  )

  $: hud = derived(
    recent.map(t => t.status),
    $statuses => {
      let pending = 0
      let success = 0
      let failure = 0

      for (const status of $statuses) {
        const statuses = Object.values(omit([LOCAL_RELAY_URL], status))
        const pubStatus = statuses.map(s => s.status)

        if (statuses.length === 0 || pubStatus.includes(PublishStatus.Pending)) {
          pending += 1
        } else if (pubStatus.includes(PublishStatus.Success)) {
          success += 1
        } else {
          failure += 1
        }
      }

      return {pending, success, failure}
    },
  )

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

  let subMenu

  $: isFeedPage = Boolean($page?.path.match(/^\/(notes)?$/))
  $: isListPage = Boolean($page?.path.match(/^\/(lists)?$/))
  $: userDisplay = deriveProfileDisplay($pubkey)

    // Fonction pour basculer l'état du menu
    function toggleSidebar() {
    $isSidebarCollapsed = !$isSidebarCollapsed
  }
</script>

<!-- Bouton pour contrôler le menu -->
<button 
  on:click={toggleSidebar}
  class="fixed left-[288px] top-4 z-[60] px-2 py-1 bg-tinted-700 text-white rounded-r-md hover:bg-tinted-600 transition-all duration-300 border-r border-t border-b border-tinted-600"
  style="transform: translateX({$isSidebarCollapsed ? '-288px' : '0'})">
  {$isSidebarCollapsed ? '▶' : '◀'}
</button>

<!-- Menu avec transition -->
<div 
  class="fixed bottom-0 left-0 top-0 z-sidebar bg-tinted-700 transition-all duration-300"
  style="
    width: 288px; 
    transform: translateX({$isSidebarCollapsed ? '-288px' : '0'})
  ">
  <!-- Votre contenu de menu existant -->
  <Anchor
    external
    class="mb-4 mt-4 flex items-center gap-2 px-6"
    href="https://info.coracle.social">
    <img
      alt="App Logo"
      src={$theme === "dark"
        ? import.meta.env.VITE_APP_WORDMARK_DARK
        : import.meta.env.VITE_APP_WORDMARK_LIGHT} />
  </Anchor>


  <MenuDesktopItem>
    <LanguageSelector />
  </MenuDesktopItem>

  <MenuDesktopItem path="/notes" isActive={isFeedPage || isListPage}>
    {$i18n.t('page.home.feeds', { default: 'Feeds' })}
  </MenuDesktopItem>

  {#if env.PLATFORM_RELAYS.length === 0}
    <MenuDesktopItem
      path="/settings/relays"
      disabled={!$signer}
      isActive={$page?.path.startsWith("/settings/relays")}>
      <div class="relative inline-block">
        {$i18n.t('page.home.relays', { default: 'Relays' })}
        {#if $slowConnections.length > 0}
          <div class="absolute -right-2.5 top-1 h-1.5 w-1.5 rounded bg-accent" />
        {/if}
      </div>
    </MenuDesktopItem>
  {/if}

  <MenuDesktopItem
    path="/notifications"
    disabled={!$signer}
    isActive={$page?.path.startsWith("/notifications")}>
    <div class="relative inline-block">
      {$i18n.t('page.home.notifications', { default: 'Notifications' })}
      {#if $hasNewNotifications}
        <div class="absolute -right-2.5 top-1 h-1.5 w-1.5 rounded bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>

  <MenuDesktopItem
    path="/channels"
    disabled={!$signer}
    isActive={$page?.path.startsWith("/channels")}>
    <div class="relative inline-block">
      {$i18n.t('page.home.messages', { default: 'Messages' })} 
      {#if $hasNewMessages}
        <div class="absolute -right-2.5 top-1 h-1.5 w-1.5 rounded bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>

  <MenuDesktopItem modal path="/groups" disabled={!$signer}>
    {$i18n.t('page.home.group', { default: 'Group' })}
  </MenuDesktopItem>

  <FlexColumn small class="absolute bottom-0 w-72">
    <Anchor
      class="staatliches px-8 text-tinted-400 hover:text-tinted-100"
      on:click={() => setSubMenu("settings")}>
      {$i18n.t('page.home.settings.title', { default: 'Settings' })}
    </Anchor>

    <div class="staatliches flex h-8 gap-2 px-8 text-tinted-500">
      <Anchor class="hover:text-tinted-100" href="/about">
        {$i18n.t('page.home.about', { default: 'About' })}
      </Anchor> /
      <Anchor external class="hover:text-tinted-100" href="/terms.html">
        {$i18n.t('page.home.terms', { default: 'Terms' })}
      </Anchor> /
      <Anchor external class="hover:text-tinted-100" href="/privacy.html">
        {$i18n.t('page.home.privacy', { default: 'Privacy' })}
      </Anchor>
    </div>

    {#if subMenu === "settings"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" on:click={toggleTheme}>
          <i class="fa fa-palette" />
          {$i18n.t('page.home.settings.toggle_theme', { default: 'Toggle Theme' })}
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings/data"
          disabled={!$signer}>
          <i class="fa fa-database" />
          {$i18n.t('page.home.settings.database', { default: 'Database' })}
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings"
          disabled={!$signer}>
          <i class="fa fa-cog" />
          {$i18n.t('page.home.settings.application_settings', { default: 'App Settings' })}
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings/content"
          disabled={!$signer}>
          <i class="fa fa-volume-xmark" />
          {$i18n.t('page.home.settings.content_settings', { default: 'Content Settings' })}
        </MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "account"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href={router.at("people").of($pubkey).toString()}>
          <i class="fa fa-user-circle" />
          {$i18n.t('page.home.settings.profile', { default: 'Profile' })}
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/settings/keys">
          <i class="fa fa-key" />
          {$i18n.t('page.home.settings.keys', { default: 'Keys' })}
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href={router.at("invite/create").qp({initialPubkey: $pubkey}).toString()}>
          <i class="fa fa-paper-plane" />
          {$i18n.t('page.home.settings.invite', { default: 'Create Invite' })}
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          on:click={() => setSubMenu("accounts")}>
          <i class="fa fa-right-left" />
          {$i18n.t('page.home.settings.switchAccount', { default: 'Switch Account' })}
        </MenuItem>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" href="/logout">
          <i class="fa fa-right-to-bracket" />
          {$i18n.t('page.home.settings.logOut', { default: 'Log Out' })}
        </MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "accounts"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        {#each Object.values($sessions) as s (s.pubkey)}
          {#if s.pubkey !== $pubkey}
            <MenuItem class="py-4" on:click={() => pubkey.set(s.pubkey)}>
              <div class="flex items-center gap-2">
                <PersonCircle
                  class="h-8 w-8 border border-solid border-tinted-200"
                  pubkey={s.pubkey} />
                {displayProfileByPubkey(s.pubkey)}
              </div>
            </MenuItem>
          {/if}
        {/each}
        <MenuItem
          class="staatliches flex items-center gap-4 py-4"
          on:click={() => router.at("login").open()}>
          <i class="fa fa-plus" />
          {$i18n.t('page.home.settings.addAccount', { default: 'Add Account' })}
        </MenuItem>
      </MenuDesktopSecondary>
    {/if}

    <div>
      <Anchor
        modal
        href="/publishes"
        class="flex h-12 cursor-pointer items-center justify-between border-t border-solid border-neutral-600 pl-7 pr-12">
        <div class="flex items-center gap-1" class:text-tinted-500={$hud.pending === 0}>
          <i class="fa fa-hourglass" />
          {$hud.pending}
        </div>
        <div class="flex items-center gap-1" class:text-tinted-500={$hud.success === 0}>
          <i class="fa fa-cloud-arrow-up" />
          {$hud.success}
        </div>
        <div
          class="flex items-center gap-1"
          class:text-accent={$hud.failure > 0}
          class:text-tinted-500={$hud.failure === 0}>
          <i class="fa fa-triangle-exclamation" />
          {$hud.failure}
        </div>
      </Anchor>

      <div class="h-20 cursor-pointer border-t border-solid border-neutral-600 px-7 py-4">
        {#if $pubkey}
          <Anchor class="flex items-center gap-2" on:click={() => setSubMenu("account")}>
            <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
            <div class="flex min-w-0 flex-col">
              <span>@{$userDisplay}</span>
              <PersonHandle class="text-sm" pubkey={$pubkey} />
            </div>
          </Anchor>
        {:else}
          <Anchor modal button accent href="/login">
            {$i18n.t('page.home.login', { default: 'Log In' })}
          </Anchor>
        {/if}
      </div>
    </div>
  </FlexColumn>
</div>

<style>
  /* Styles pour les transitions */
  :global(body) {
    transition: padding-left 0.3s ease-in-out;
    padding-left: var(--sidebar-width, 288px); /* 72px * 4 pour tenir compte du scale Tailwind */
  }

  :global(body[data-sidebar-collapsed="true"]) {
    padding-left: 0;
  }

  /* Ajustez les styles existants si nécessaire */
  .transition-all {
    transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
  }
</style>