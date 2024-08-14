<script lang="ts">
  import {page} from "$app/stores"
  import {fly} from '@lib/transition'
  import Icon from "@lib/components/Icon.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import {getPrimaryNavItem} from '@app/routes'
</script>

<div class="flex w-60 flex-col gap-1 bg-base-300 px-2 py-4">
  {#if getPrimaryNavItem($page) === 'discover'}
    <div in:fly>
      <SecondaryNavItem href="/spaces">
        <Icon icon="widget" /> Spaces
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 50}}>
      <SecondaryNavItem href="/themes">
        <Icon icon="pallete-2" /> Themes
      </SecondaryNavItem>
    </div>
  {:else if getPrimaryNavItem($page) === 'space'}
    <!-- pass -->
  {:else if getPrimaryNavItem($page) === 'settings'}
    <!-- pass -->
  {:else}
    <div in:fly>
      <SecondaryNavItem href="/home">
        <Icon icon="home-smile" /> Home
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 50}}>
      <SecondaryNavItem href="/people">
        <Icon icon="user-heart" /> People
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 100}}>
      <SecondaryNavItem href="/notes">
        <Icon icon="clipboard-text" /> Saved Notes
      </SecondaryNavItem>
    </div>
    <div
      in:fly={{delay: 150}}
      class="text-stark-content flex items-center justify-between px-4 py-2 text-sm font-bold uppercase">
      Conversations
      <div class="cursor-pointer">
        <Icon icon="add-circle" class="bg-stark-content" />
      </div>
    </div>
  {/if}
</div>
