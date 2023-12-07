<script lang="ts">
  import {randomId} from 'hurdak'
  import {appName, toggleTheme, installPrompt, installAsPWA} from 'src/partials/state'
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {slowConnections, menuIsOpen} from "src/app/state"
  import {router} from "src/app/router"
  import {env, canUseGiftWrap, hasNewNip04Messages, hasNewNotifications, pubkey, sessions, displayPubkey} from "src/engine"

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

  let subMenu
</script>

{#if $menuIsOpen}
  <SliderMenu onClick={closeMenu} onEscape={closeMenu}>
    <div on:click|stopPropagation>
      <MenuItem class="py-4" on:click={() => setSubMenu('about')}>About</MenuItem>
      <MenuItem class="py-4" on:click={() => setSubMenu('settings')}>Settings</MenuItem>
      <MenuItem class="py-4" on:click={() => setSubMenu('account')}>Account</MenuItem>
    </div>
    {#if $env.FORCE_RELAYS.length === 0}
      <MenuItem class="py-4" href="/settings/relays">
        <div class="relative inline-block">
          Relays
          {#if $slowConnections.length > 0}
            <div
              class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuItem>
    {/if}
    {#if $env.ENABLE_GROUPS}
      <MenuItem disabled={!$canUseGiftWrap} class="py-4" href="/groups">Groups</MenuItem>
    {/if}
    <MenuItem class="py-4" href="/conversations">
      <div class="relative inline-block">
        Messages
        {#if $hasNewNip04Messages}
          <div
            class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </div>
    </MenuItem>
    <MenuItem class="py-4" href="/notifications">
      <div class="relative inline-block">
        Notifications
        {#if $hasNewNotifications}
          <div
            class="absolute top-0 -right-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </div>
    </MenuItem>
    <MenuItem on:click={() => router.at('notes').push({key: randomId()})}>Feed</MenuItem>
  </SliderMenu>
{/if}

{#if subMenu === "about"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <MenuItem external class="py-4" href="/terms.html">Terms</MenuItem>
    <MenuItem external class="py-4" href="/privacy.html">Privacy</MenuItem>
    <MenuItem external class="py-4" href="https://github.com/coracle-social/coracle/issues/new">
      Feedback
    </MenuItem>
    {#if $installPrompt}
      <MenuItem class="py-4" on:click={installAsPWA}>Install</MenuItem>
    {/if}
    <MenuItem class="py-4" href="/about">About {appName}</MenuItem>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
    <MenuItem class="py-4" on:click={toggleTheme}>Toggle Theme</MenuItem>
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
      <MenuItem class="py-4"  on:click={() => setSubMenu('accounts')}>Switch Account</MenuItem>
    </div>
    <MenuItem class="py-4" href="/settings/profile">Edit Profile</MenuItem>
    <MenuItem class="py-4" href={router.at("people").of($pubkey).toString()}>
      My Notes
    </MenuItem>
  </SliderMenu>
{/if}

{#if subMenu === "accounts"}
  <SliderMenu onClick={closeMenu} onEscape={closeSubMenu}>
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
  </SliderMenu>
{/if}
