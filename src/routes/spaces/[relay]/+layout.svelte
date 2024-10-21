<script lang="ts">
  import {page} from "$app/stores"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Delay from "@lib/components/Delay.svelte"
  import Button from "@lib/components/Button.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {decodeRelay} from "@app/state"
  import {pushDrawer} from "@app/modal"

  const openMenu = () => pushDrawer(MenuSpace, {url})

  $: url = decodeRelay($page.params.relay)
</script>

{#key url}
  <Delay>
    <SecondaryNav>
      <MenuSpace {url} />
    </SecondaryNav>
    <Page>
      {#key $page.params.room}
        <slot />
      {/key}
    </Page>
  </Delay>
{/key}

<div class="fixed right-7 top-7 z-feature md:hidden">
  <Button on:click={openMenu}>
    <Icon icon="menu-dots" />
  </Button>
</div>
