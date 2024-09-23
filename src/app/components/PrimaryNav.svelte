<style>
  .z-nav-active {
    -webkit-mask-image: url("/nav-active.svg");
    mask-image: url("/nav-active.svg");
  }
</style>

<script lang="ts">
  import {page} from "$app/stores"
  import {tweened} from "svelte/motion"
  import {quintOut} from "svelte/easing"
  import {displayRelayUrl} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import {userProfile, userMembership} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeSpacePath, getPrimaryNavItemIndex} from "@app/routes"

  const activeOffset = tweened(-44, {
    duration: 300,
    easing: quintOut,
  })

  const addSpace = () => pushModal(SpaceAdd)

  let element: HTMLElement

  // Set the active highlight element to the offset of the nav item we're focused on
  $: {
    if (element) {
      const index = getPrimaryNavItemIndex($page)
      const navItems: any = Array.from(element.querySelectorAll(".z-nav-item") || [])

      activeOffset.set(navItems[index].offsetTop - 44)
    }
  }
</script>

<div class="relative w-14 flex-shrink-0 bg-base-100 pt-4" bind:this={element}>
  <div
    class="absolute z-nav-active ml-2 h-[144px] w-12 bg-base-300"
    style={`top: ${$activeOffset}px`} />
  <div class="flex h-full flex-col justify-between">
    <div>
      <PrimaryNavItem href="/home">
        <Avatar
          src={$userProfile?.picture}
          class="!h-10 !w-10 border border-solid border-base-300"
          size={7} />
      </PrimaryNavItem>
      {#each $userMembership?.roomsByUrl.keys() || [] as url (url)}
        <PrimaryNavItem title={displayRelayUrl(url)} href={makeSpacePath(url)}>
          <SpaceAvatar {url} />
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space" on:click={addSpace}>
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="add-circle" />
        </div>
      </PrimaryNavItem>
      <PrimaryNavItem title="Discover Spaces" href="/discover">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={6} icon="compass-big" />
        </div>
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings" href="/settings">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="settings" />
        </div>
      </PrimaryNavItem>
    </div>
  </div>
</div>
