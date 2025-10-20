<script lang="ts">
  import {derived} from "svelte/store"
  import {ago, omit, spec, MINUTE} from "@welshman/lib"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import {
    signer,
    pubkey,
    sessions,
    deriveProfileDisplay,
    displayProfileByPubkey,
    thunks,
    thunkIsComplete,
  } from "@welshman/app"
  import {toggleTheme, theme} from "src/partials/state"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuDesktopItem from "src/app/MenuDesktopItem.svelte"
  import MenuDesktopSecondary from "src/app/MenuDesktopSecondary.svelte"
  import {slowConnections} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications} from "src/engine"

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

  let subMenu

  $: hud = derived(thunks, $thunks => {
    let pending = 0
    let success = 0
    let failure = 0

    for (const thunk of $thunks) {
      if (thunk.event.pubkey !== $pubkey) {
        continue
      }

      if (thunk.event.created_at < ago(5, MINUTE)) {
        continue
      }

      const results = Object.values(omit([LOCAL_RELAY_URL], thunk.results))

      if (!thunkIsComplete(thunk)) {
        pending += 1
      } else if (results.some(spec({status: PublishStatus.Success}))) {
        success += 1
      } else {
        failure += 1
      }
    }

    return {pending, success, failure}
  })

  $: isFeedPage = Boolean($page?.path.match(/^\/(notes)?$/))
  $: isListPage = Boolean($page?.path.match(/^\/(lists)?$/))
  $: userDisplay = deriveProfileDisplay($pubkey)
</script>

<div class="bottom-sai left-sai top-sai fixed z-sidebar w-72 bg-tinted-700 transition-colors">
  <Link external class="mb-4 mt-4 flex items-center gap-2 px-6" href="https://info.coracle.social">
    <img
      alt="App Logo"
      src={$theme === "dark"
        ? import.meta.env.VITE_APP_WORDMARK_DARK
        : import.meta.env.VITE_APP_WORDMARK_LIGHT} />
  </Link>
  <MenuDesktopItem path="/notes" isActive={isFeedPage || isListPage}>Feeds</MenuDesktopItem>
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
    <Button
      class="staatliches px-8 text-start text-tinted-400 hover:text-tinted-100"
      on:click={() => setSubMenu("settings")}>Settings</Button>
    <div class="staatliches flex h-8 gap-2 px-8 text-tinted-500">
      <Link class="hover:text-tinted-100" href="/about">About</Link> /
      <Link external class="hover:text-tinted-100" href="/terms.html">Terms</Link> /
      <Link external class="hover:text-tinted-100" href="/privacy.html">Privacy</Link>
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
          href="/settings/wallet"
          disabled={!$signer}>
          <i class="fa fa-wallet" /> Wallet
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
      <Link
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
      </Link>
      <div class="h-20 cursor-pointer border-t border-solid border-neutral-600 px-7 py-4">
        {#if $pubkey}
          <Button class="flex items-center gap-2 text-start" on:click={() => setSubMenu("account")}>
            <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
            <div class="flex min-w-0 flex-col">
              <span>@{$userDisplay}</span>
              <PersonHandle class="text-sm" pubkey={$pubkey} />
            </div>
          </Button>
        {:else}
          <Link modal class="btn btn-accent" href="/login">Log In</Link>
        {/if}
      </div>
    </div>
  </FlexColumn>
</div>
