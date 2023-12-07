<script lang="ts">
  import cx from 'classnames'
  import {randomId} from 'hurdak'
  import {appName, toggleTheme, installPrompt, installAsPWA} from 'src/partials/state'
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuDesktopItem from 'src/app/MenuDesktopItem.svelte'
  import MenuDesktopSecondary from "src/app/MenuDesktopSecondary.svelte"
  import {slowConnections} from "src/app/state"
  import {router} from "src/app/router"
  import {env, canUseGiftWrap, hasNewNip04Messages, hasNewNotifications, pubkey, sessions, displayPubkey} from "src/engine"

  const {page} = router

  const closeSubMenu = () => {
    subMenu = null
  }

  const setSubMenu = name => {
    subMenu = name
  }

  const goToFeed = () => router.at('notes').push({key: randomId()})

  const secondaryClass = "relative staatliches h-8 block transition-all text-light hover:text-warm px-8"

  let subMenu, active

  $: myNotesPath = router.at("people").of($pubkey).toString()

  $: {
    if ($page.path.startsWith('/notes')) {
      active = 'feed'
    } else if ($page.path.startsWith('/notifications')) {
      active = 'notifications'
    } else if ($page.path.startsWith('/conversations')) {
      active = 'conversations'
    } else if ($page.path.startsWith(myNotesPath)) {
      active = 'my_notes'
    }
  }
</script>

<div class={cx("fixed top-0 left-0 bottom-0 w-60 transition-colors border-r border-solid border-mid bg-cocoa")}>
  <Anchor class="flex items-center gap-1 p-6 mb-4" external href="https://info.coracle.social">
    <img alt="App Logo" src={import.meta.env.VITE_LOGO_URL || "/images/logo.png"} class="w-10" />
    <h1 class="staatliches text-3xl">Coracle</h1>
  </Anchor>
  <MenuDesktopItem path="/notes" on:click={goToFeed}>Feed</MenuDesktopItem>
  <MenuDesktopItem path="/notifications">
    <div class="relative inline-block">
      Notifications
      {#if $hasNewNotifications}
        <div
          class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>
  <MenuDesktopItem path="/conversations">
    <div class="relative inline-block">
      Messages
      {#if $hasNewNip04Messages}
        <div
          class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </MenuDesktopItem>
  {#if $env.ENABLE_GROUPS}
    <MenuDesktopItem disabled={!$canUseGiftWrap} path="/groups">Groups</MenuDesktopItem>
  {/if}
  <MenuDesktopItem path={myNotesPath}>
    My Notes
  </MenuDesktopItem>
  {#if $env.FORCE_RELAYS.length === 0}
    <MenuDesktopItem path="/settings/relays">
      <div class="relative inline-block">
        Relays
        {#if $slowConnections.length > 0}
          <div
            class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </div>
    </MenuDesktopItem>
  {/if}
  <FlexColumn small class="absolute bottom-0 w-60">
    <Anchor class={secondaryClass} on:click={() => setSubMenu('account')}>Account</Anchor>
    <Anchor class={secondaryClass} on:click={() => setSubMenu('settings')}>Settings</Anchor>
    <Anchor class={secondaryClass} href="/about">About {appName}</Anchor>
    <div class="staatliches h-8 block text-light px-8 flex gap-2">
      <Anchor external class=" hover:text-warm" href="/terms.html">Terms</Anchor> /
      <Anchor external class=" hover:text-warm" href="/privacy.html">Privacy</Anchor> /
      <Anchor external class=" hover:text-warm" href="https://github.com/coracle-social/coracle/issues/new">Feedback</Anchor>
    </div>
    {#if subMenu === "settings"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem class="py-4" on:click={toggleTheme}>Toggle Theme</MenuItem>
        <MenuItem class="py-4" href="/settings">Configuration</MenuItem>
        <MenuItem class="py-4" href="/settings/data">Database</MenuItem>
        <MenuItem class="py-4" href="/settings/content">Content</MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "account"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        <MenuItem class="py-4" href="/settings/keys">Keys</MenuItem>
        <MenuItem class="py-4" href="/settings/profile">Edit Profile</MenuItem>
      </MenuDesktopSecondary>
    {:else if subMenu === "accounts"}
      <MenuDesktopSecondary onEscape={closeSubMenu}>
        {#each Object.values($sessions) as s (s.pubkey)}
          {#if s.pubkey !== $pubkey}
            <MenuItem class="py-4" on:click={() => pubkey.set(s.pubkey)}>
              <div class="flex items-center justify-center gap-2">
                <PersonCircle class="w-8 h-8 border border-solid border-warm" pubkey={s.pubkey} />
                {displayPubkey(s.pubkey)}
              </div>
            </MenuItem>
          {/if}
        {/each}
        <MenuItem class="py-4" on:click={() => router.at("login/advanced").open()}>
          Add Account
        </MenuItem>
      </MenuDesktopSecondary>
    {/if}
    <div class="relative z-10 border-t border-solid border-mid flex items-center gap-2 px-7 pt-3 pb-6 max-w-full group cursor-pointer">
      <PersonCircle class="w-10 h-10" pubkey={$pubkey} />
      <div class="flex flex-col">
        <span>@{displayPubkey($pubkey)}</span>
        <PersonHandle class="text-sm" pubkey={$pubkey} />
      </div>
      <div class="absolute -right-28 h-14 w-28 flex gap-2 items-center justify-center">
        <div class="w-10 h-10 rounded-full bg-cocoa flex items-center justify-center opacity-0 transition-all group-hover:opacity-100 text-light hover:text-warm">
          <i class="fa fa-right-left" />
        </div>
        <div class="w-10 h-10 rounded-full bg-cocoa flex items-center justify-center opacity-0 transition-all group-hover:opacity-100 text-light hover:text-warm">
          <i class="fa fa-right-to-bracket" />
        </div>
      </div>
    </div>
  </FlexColumn>
</div>

