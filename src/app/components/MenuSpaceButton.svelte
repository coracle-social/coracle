<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import {notifications} from "@app/notifications"
  import {makeSpacePath} from "@app/routes"
  import {pushDrawer} from "@app/modal"

  export let url

  const path = makeSpacePath(url)

  const openMenu = () => pushDrawer(MenuSpace, {url})
</script>

<Button on:click={openMenu} class="btn btn-neutral btn-sm relative md:hidden">
  <Icon icon="menu-dots" />
  {#if $notifications.has(path)}
    <div class="absolute right-0 top-0 -mr-1 -mt-1 h-2 w-2 rounded-full bg-primary" />
  {/if}
</Button>
