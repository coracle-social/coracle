<script lang="ts">
  import {randomId} from "hurdak"
  import {toggleTheme, installPrompt, installAsPWA} from "src/partials/state"
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
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
    <div class="grid grid-cols-2 gap-x-8 gap-y-3 m-auto">
      {#if $installPrompt}
        <Anchor class="p-3 flex gap-3 items-center" on:click={installAsPWA}>
          <i class="fa fa-rocket w-8" /> Install
        </Anchor>
      {/if}
      <Anchor external class="p-3 flex gap-3 items-center" href="/terms.html">
        <i class="fa fa-scale-balanced w-8" /> Terms
      </Anchor>
      <Anchor external class="p-3 flex gap-3 items-center" href="/privacy.html">
        <i class="fa fa-eye-slash w-8" /> Privacy
      </Anchor>
      <Anchor class="p-3 flex gap-3 items-center" on:click={toggleTheme}>
        <i class="fa fa-palette w-8" /> Theme
      </Anchor>
      <Anchor class="p-3 flex gap-3 items-center" href="/about">
        <i class="fa fa-info-circle w-8" /> About
      </Anchor>
      <div on:click|stopPropagation>
        <Anchor class="p-3 flex gap-3 items-center" on:click={openSettings}>
          <i class="fa fa-cog w-8" /> Settings
        </Anchor>
      </div>
      <div on:click|stopPropagation>
        <Anchor class="p-3 flex gap-3 items-center" on:click={openAccount}>
          <i class="fa fa-user-circle w-8" /> Account
        </Anchor>
      </div>
    </div>
    <div class="h-px bg-mid my-4 m-auto" style="width: 200px;" />
    <div class="flex flex-col gap-2 staatliches text-2xl">
      {#if $env.FORCE_RELAYS.length === 0}
        <MenuItem class="py-4" href="/settings/relays">
          <div class="relative inline-block">
            Relays
            {#if $slowConnections.length > 0}
              <div
                class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
            {/if}
          </div>
        </MenuItem>
      {/if}
      {#if $env.ENABLE_GROUPS}
        <MenuItem disabled={!$canUseGiftWrap} class="py-4" href="/groups">Groups</MenuItem>
      {/if}
      <MenuItem class="py-4" href="/channels">
        <div class="relative inline-block">
          Messages
          {#if $hasNewNip24Messages}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuItem>
      <MenuItem class="py-4" href="/notifications">
        <div class="relative inline-block">
          Notifications
          {#if $hasNewNotifications}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuItem>
      <MenuItem on:click={() => router.at("notes").push({key: randomId()})}>Feed</MenuItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <MenuItem class="py-4" href="/settings">Configuration</MenuItem>
    <MenuItem class="py-4" href="/settings/data">Database</MenuItem>
    <MenuItem class="py-4" href="/settings/content">Content</MenuItem>
    <MenuItem class="py-4" href="/settings/keys">Keys</MenuItem>
  </SliderMenu>
{/if}

{#if subMenu === "account"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <MenuItem class="py-4" href="/logout">Logout</MenuItem>
    <div on:click|stopPropagation>
      <MenuItem class="py-4" on:click={() => setSubMenu("accounts")}>Switch Account</MenuItem>
    </div>
    <MenuItem class="py-4" href="/settings/profile">Edit Profile</MenuItem>
    <MenuItem class="py-4" href={router.at("people").of($pubkey).toString()}>My Notes</MenuItem>
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
      Add Account
    </MenuItem>
  </SliderMenu>
{/if}
