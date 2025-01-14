<script lang="ts">
  import {onMount} from "svelte"
  import {displayRelayUrl, GROUP_META} from "@welshman/util"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceInvite from "@app/components/SpaceInvite.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import ProfileList from "@app/components/ProfileList.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import MenuSpaceRoomItem from "@app/components/MenuSpaceRoomItem.svelte"
  import {
    userRoomsByUrl,
    hasMembershipUrl,
    memberships,
    deriveUserRooms,
    deriveOtherRooms,
  } from "@app/state"
  import {notifications} from "@app/notifications"
  import {pullConservatively} from "@app/requests"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"

  export let url

  const threadsPath = makeSpacePath(url, "threads")
  const userRooms = deriveUserRooms(url)
  const otherRooms = deriveOtherRooms(url)

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

  const showMembers = () =>
    pushModal(
      ProfileList,
      {pubkeys: members, title: `Members of`, subtitle: displayRelayUrl(url)},
      {replaceState},
    )

  const createInvite = () => pushModal(SpaceInvite, {url}, {replaceState})

  const leaveSpace = () => pushModal(SpaceExit, {url}, {replaceState})

  const joinSpace = () => pushModal(SpaceJoin, {url}, {replaceState})

  const addRoom = () => pushModal(RoomCreate, {url}, {replaceState})

  let showMenu = false
  let replaceState = false
  let element: Element

  $: members = $memberships.filter(l => hasMembershipUrl(l, url)).map(l => l.event.pubkey)

  onMount(async () => {
    replaceState = Boolean(element.closest(".drawer"))
    pullConservatively({relays: [url], filters: [{kinds: [GROUP_META]}]})
  })
</script>

<div bind:this={element}>
  <SecondaryNavSection class="max-h-screen">
    <div>
      <SecondaryNavItem class="w-full !justify-between" on:click={openMenu}>
        <strong class="ellipsize">{displayRelayUrl(url)}</strong>
        <Icon icon="alt-arrow-down" />
      </SecondaryNavItem>
      {#if showMenu}
        <Popover hideOnClick onClose={toggleMenu}>
          <ul
            transition:fly
            class="menu absolute z-popover mt-2 w-full rounded-box bg-base-100 p-2 shadow-xl">
            <li>
              <Button on:click={showMembers}>
                <Icon icon="user-rounded" />
                View Members ({members.length})
              </Button>
            </li>
            <li>
              <Button on:click={createInvite}>
                <Icon icon="link-round" />
                Create Invite
              </Button>
            </li>
            <li>
              {#if $userRoomsByUrl.has(url)}
                <Button on:click={leaveSpace} class="text-error">
                  <Icon icon="exit" />
                  Leave Space
                </Button>
              {:else}
                <Button on:click={joinSpace} class="bg-primary text-primary-content">
                  <Icon icon="login-2" />
                  Join Space
                </Button>
              {/if}
            </li>
          </ul>
        </Popover>
      {/if}
    </div>
    <div class="flex min-h-0 flex-col gap-1 overflow-auto">
      <SecondaryNavItem href={makeSpacePath(url)}>
        <Icon icon="home-smile" /> Home
      </SecondaryNavItem>
      <SecondaryNavItem href={threadsPath} notification={$notifications.has(threadsPath)}>
        <Icon icon="notes-minimalistic" /> Threads
      </SecondaryNavItem>
      <div class="h-2" />
      <SecondaryNavHeader>Your Rooms</SecondaryNavHeader>
      {#each $userRooms as room, i (room)}
        <MenuSpaceRoomItem notify {url} {room} />
      {/each}
      {#if $otherRooms.length > 0}
        <div class="h-2" />
        <SecondaryNavHeader>
          {#if $userRooms.length > 0}
            Other Rooms
          {:else}
            Rooms
          {/if}
        </SecondaryNavHeader>
      {/if}
      {#each $otherRooms as room, i (room)}
        <MenuSpaceRoomItem {url} {room} />
      {/each}
      <SecondaryNavItem on:click={addRoom}>
        <Icon icon="add-circle" />
        Create room
      </SecondaryNavItem>
    </div>
  </SecondaryNavSection>
</div>
