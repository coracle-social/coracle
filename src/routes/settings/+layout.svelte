<script lang="ts">
  import type {Snippet} from "svelte"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import LogOut from "@app/components/LogOut.svelte"
  import {pushModal} from "@app/modal"
  import {theme} from "@app/theme"

  type Props = {
    children?: Snippet
  }

  const {children}: Props = $props()

  const logout = () => pushModal(LogOut)

  const toggleTheme = () => theme.set($theme === "dark" ? "light" : "dark")
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <div in:fly|local>
      <SecondaryNavItem href="/settings/profile">
        <Icon icon="user-circle" /> Profile
      </SecondaryNavItem>
    </div>
    <div in:fly|local={{delay: 50}}>
      <SecondaryNavItem href="/settings/relays">
        <Icon icon="server" /> Relays
      </SecondaryNavItem>
    </div>
    <div in:fly|local={{delay: 100}}>
      <SecondaryNavItem href="/settings">
        <Icon icon="settings" /> Settings
      </SecondaryNavItem>
    </div>
    <div in:fly|local={{delay: 150}}>
      <SecondaryNavItem onclick={toggleTheme}>
        <Icon icon="moon" /> Theme
      </SecondaryNavItem>
    </div>
    <div in:fly|local={{delay: 200}}>
      <SecondaryNavItem href="/settings/about">
        <Icon icon="info-square" /> About
      </SecondaryNavItem>
    </div>
    <div in:fly|local={{delay: 250}}>
      <SecondaryNavItem class="text-error hover:text-error" onclick={logout}>
        <Icon icon="exit" /> Log Out
      </SecondaryNavItem>
    </div>
  </SecondaryNavSection>
</SecondaryNav>

<Page>
  {@render children?.()}
</Page>
