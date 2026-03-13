<script lang="ts">
  import {_} from "svelte-i18n"
  import {signer, pubkey, sessions, displayProfileByPubkey} from "@welshman/app"
  import {toggleTheme, installPrompt, installAsPWA} from "src/partials/state"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import SliderMenu from "src/partials/SliderMenu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import MenuMobileItem from "src/app/MenuMobileItem.svelte"
  import {slowConnections, menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications} from "src/engine"

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

  const openFeeds = () => {
    router.at("notes").push()
    closeMenu()
  }

  let subMenu
</script>

{#if $menuIsOpen}
  <SliderMenu onEscape={closeMenu}>
    <div class="m-auto max-w-[236px] py-8">
      {#if $pubkey}
        <Button
          stopPropagation
          class="flex items-center justify-center gap-2 text-start"
          on:click={openAccount}>
          <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
          <div class="flex min-w-0 flex-col">
            <span>@{displayProfileByPubkey($pubkey)}</span>
            <PersonHandle class="text-sm" pubkey={$pubkey} />
          </div>
        </Button>
      {:else}
        <div class="flex justify-center">
          <Link class="btn btn-accent" modal href="/login">{$_("nav.logIn")}</Link>
        </div>
      {/if}
    </div>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      <MenuMobileItem stopPropagation on:click={openSettings}>
        <i class="fa fa-cog" />
        {$_("menu.settings")}
      </MenuMobileItem>
      <MenuMobileItem href="/settings/relays" disabled={!$signer} on:click={closeMenu}>
        <i class="fa fa-server" />
        <div class="relative inline-block">
          {$_("menu.relays")}
          {#if $slowConnections.length > 0}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/notifications" on:click={closeMenu}>
        <i class="fa fa-bell" />
        <div class="relative inline-block">
          {$_("menu.notifications")}
          {#if $hasNewNotifications}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem modal disabled={!$signer} href="/groups" on:click={closeMenu}>
        <i class="fa fa-circle-nodes" />
        {$_("menu.groups")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/channels" on:click={closeMenu}>
        <i class="fa fa-message" />
        <div class="relative inline-block">
          {$_("menu.messages")}
          {#if $hasNewMessages}
            <div
              class="absolute -right-2 top-0 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </div>
      </MenuMobileItem>
      <MenuMobileItem on:click={openFeeds}>
        <i class="fa fa-rss" />
        {$_("menu.feeds")}
      </MenuMobileItem>
    </div>
    <div class="staatliches mt-8 block flex h-8 justify-center gap-2 px-8 text-tinted-400">
      <Link class="hover:text-tinted-200" href="/about">{$_("menu.about")}</Link> /
      <Link external class="hover:text-tinted-200" href="/terms.html">{$_("menu.terms")}</Link> /
      <Link external class="hover:text-tinted-200" href="/privacy.html">{$_("menu.privacy")}</Link>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "settings"}
  <SliderMenu onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">{$_("menu.settings")}</p>
    <div class="staatliches m-auto grid grid-cols-2 gap-3">
      {#if $installPrompt}
        <MenuMobileItem on:click={installAsPWA} on:click={closeMenu}>
          <i class="fa fa-rocket" />
          {$_("menu.install")}
        </MenuMobileItem>
      {/if}
      <MenuMobileItem on:click={toggleTheme} on:click={closeMenu}>
        <i class="fa fa-palette" />
        {$_("menu.theme")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/settings/data" on:click={closeMenu}>
        <i class="fa fa-database" />
        {$_("menu.database")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/settings/wallet" on:click={closeMenu}>
        <i class="fa fa-wallet" />
        {$_("menu.wallet")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/settings/content" on:click={closeMenu}>
        <i class="fa fa-volume-xmark" />
        {$_("menu.content")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/settings" on:click={closeMenu}>
        <i class="fa fa-sliders" />
        {$_("menu.appSettings")}
      </MenuMobileItem>
      <MenuMobileItem disabled={!$signer} href="/lists" on:click={closeMenu}>
        <i class="fa fa-list" />
        {$_("menu.lists")}
      </MenuMobileItem>
    </div>
  </SliderMenu>
{/if}

{#if subMenu === "account"}
  <SliderMenu onEscape={closeSubMenu}>
    <p class="staatliches mb-8 text-center text-3xl">{$_("menu.account")}</p>
    <div class="staatliches m-auto mb-8 grid grid-cols-2 gap-3">
      <MenuMobileItem href="/settings/keys" on:click={closeMenu}>
        <i class="fa fa-key" />
        {$_("menu.keys")}
      </MenuMobileItem>
      <MenuMobileItem href={router.at("people").of($pubkey).toString()} on:click={closeMenu}>
        <i class="fa fa-user-circle" />
        {$_("menu.profile")}
      </MenuMobileItem>
      <MenuMobileItem
        href={router.at("invite/create").qp({initialPubkey: $pubkey}).toString()}
        on:click={closeMenu}>
        <i class="fa fa-paper-plane" />
        {$_("menu.createInvite")}
      </MenuMobileItem>
    </div>
    <div class="staatliches block flex h-8 justify-center gap-2 px-8 text-tinted-400">
      <Link class="hover:text-tinted-200" href="/logout" on:click={closeMenu}
        >{$_("menu.logout")}</Link>
      /
      <Button class="hover:text-tinted-200" stopPropagation on:click={() => setSubMenu("accounts")}>
        {$_("menu.switchAccounts")}
      </Button>
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
      <i class="fa fa-plus" />
      {$_("menu.addAccount")}
    </MenuItem>
  </SliderMenu>
{/if}
