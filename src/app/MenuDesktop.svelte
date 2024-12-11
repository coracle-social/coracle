<script lang="ts">
  import {seconds} from "hurdak"
  import {derived, get} from "svelte/store"
  import {now, omit} from "@welshman/lib"
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
  import {env, hasNewMessages} from "src/engine"
  import {hasNewNotifications} from "src/domain/notifications"

  const {page} = router

  const hud = derived(thunks, $thunks => {
    const pending = []
    const success = []
    const failure = []

    for (const {event, request, status} of Object.values($thunks) as Thunk[]) {
      if (event.created_at < now() - seconds(5, "minute")) {
        continue
      }

      const statuses = Object.values(omit([LOCAL_RELAY_URL], get(status))).map(s => s.status)

      if (statuses.includes(PublishStatus.Success)) {
        success.push(request.event)
      } else if (statuses.includes(PublishStatus.Pending)) {
        pending.push(request.event)
      } else if (statuses.length > 0) {
        failure.push(request.event)
      }
    }

    return {pending, success, failure}
  })

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
</script>

<div class="fixed bottom-0 left-0 top-0 z-nav w-72 bg-tinted-700 transition-colors">
  <Anchor external class="mb-4 mt-4 flex items-center gap-2 px-6" href="https://coracle.tools">
    <img
      alt="App Logo"
      src={$theme === "dark"
        ? import.meta.env.VITE_APP_WORDMARK_DARK
        : import.meta.env.VITE_APP_WORDMARK_LIGHT} />
  </Anchor>
  <MenuDesktopItem path="/notes" isActive={isFeedPage || isListPage}>Feeds</MenuDesktopItem>
  {#if env.PLATFORM_RELAYS.length === 0}
    <MenuDesktopItem
      path="/settings/relays"
      disabled={!$signer}
      isActive={$page?.path.startsWith("/settings/relays")}>
      <div class="relative inline-block">
        Relays
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
      Notifications
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
      Messages
      {#if $hasNewMessages}
        <div class="absolute -right-2.5 top-1 h-1.5 w-1.5 rounded bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>
  <MenuDesktopItem modal path="/groups" disabled={!$signer}>Groups</MenuDesktopItem>
  <FlexColumn small class="absolute bottom-0 w-72">
    <Anchor
      class="staatliches px-8 text-tinted-400 hover:text-tinted-100"
      on:click={() => setSubMenu("settings")}>Settings</Anchor>
    <div class="staatliches flex h-8 gap-2 px-8 text-tinted-500">
      <Anchor class="hover:text-tinted-100" href="/about">About</Anchor> /
      <Anchor external class="hover:text-tinted-100" href="/terms.html">Terms</Anchor> /
      <Anchor external class="hover:text-tinted-100" href="/privacy.html">Privacy</Anchor>
    </div>
    {#if subMenu === "settings"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem class="staatliches flex items-center gap-4 py-4 pl-8" on:click={toggleTheme}>
          <i class="fa fa-palette" /> Toggle Theme
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings/data"
          disabled={!$signer}>
          <i class="fa fa-database" /> Database
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings"
          disabled={!$signer}>
          <i class="fa fa-cog" /> App Settings
        </MenuItem>
        <MenuItem
          class="staatliches flex items-center gap-4 py-4 pl-8"
          href="/settings/content"
          disabled={!$signer}>
          <i class="fa fa-volume-xmark" /> Content Settings
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
          href={router.at("invite/create").qp({initialPubkey: $pubkey}).toString()}>
          <i class="fa fa-paper-plane" /> Create Invite
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
          <i class="fa fa-plus" /> Add Account
        </MenuItem>
      </MenuDesktopSecondary>
    {/if}
    <div>
      <Anchor
        modal
        href="/publishes"
        class="flex h-12 cursor-pointer items-center justify-between border-t border-solid border-neutral-600 pl-7 pr-12">
        <div class="flex items-center gap-1" class:text-tinted-500={$hud.pending.length === 0}>
          <i class="fa fa-hourglass" />
          {$hud.pending.length}
        </div>
        <div class="flex items-center gap-1" class:text-tinted-500={$hud.success.length === 0}>
          <i class="fa fa-cloud-arrow-up" />
          {$hud.success.length}
        </div>
        <div
          class="flex items-center gap-1"
          class:text-accent={$hud.failure.length > 0}
          class:text-tinted-500={$hud.failure.length === 0}>
          <i class="fa fa-triangle-exclamation" />
          {$hud.failure.length}
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
          <Anchor modal button accent href="/login">Log In</Anchor>
        {/if}
      </div>
    </div>
  </FlexColumn>
</div>
