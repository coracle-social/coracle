<script lang="ts">
  import {onMount} from "svelte"
  import {displayRelayUrl} from "@welshman/util"
  import {fly, slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceInvite from "@app/components/SpaceInvite.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import {
    getMembershipRoomsByUrl,
    getMembershipUrls,
    userMembership,
    roomsByUrl,
    GENERAL,
  } from "@app/state"
  import {checkRelayConnection, checkRelayAuth} from "@app/commands"
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {makeSpacePath} from "@app/routes"

  export let url

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

  const createInvite = () => pushModal(SpaceInvite, {url})

  const leaveSpace = () => pushModal(SpaceExit, {url})

  const joinSpace = () => pushModal(SpaceJoin, {url})

  const addRoom = () => pushModal(RoomCreate, {url})

  const getDelay = (reset = false) => {
    if (reset) {
      delay = 0
    } else {
      delay += 50
    }

    return delay
  }

  let delay = 0
  let showMenu = false

  $: rooms = getMembershipRoomsByUrl(url, $userMembership)
  $: otherRooms = ($roomsByUrl.get(url) || []).filter(room => !rooms.concat(GENERAL).includes(room))

  onMount(async () => {
    const error = (await checkRelayConnection(url)) || (await checkRelayAuth(url))

    if (error) {
      pushToast({theme: "error", message: error})
    }
  })
</script>

<SecondaryNavSection>
  <div>
    <SecondaryNavItem class="w-full !justify-between" on:click={openMenu}>
      <strong>{displayRelayUrl(url)}</strong>
      <Icon icon="alt-arrow-down" />
    </SecondaryNavItem>
    {#if showMenu}
      <Popover hideOnClick onClose={toggleMenu}>
        <ul
          transition:fly
          class="menu absolute z-popover mt-2 w-full rounded-box bg-base-100 p-2 shadow-xl">
          <li>
            <Button on:click={createInvite}>
              <Icon icon="link-round" />
              Create Invite
            </Button>
          </li>
          {#if !import.meta.env.VITE_PLATFORM_RELAY}
            <li>
              {#if getMembershipUrls($userMembership).includes(url)}
                <Button on:click={leaveSpace} class="text-error">
                  <Icon icon="exit" />
                  Leave Space
                </Button>
              {:else}
                <Button on:click={joinSpace}>
                  <Icon icon="login-2" />
                  Join Space
                </Button>
              {/if}
            </li>
          {/if}
        </ul>
      </Popover>
    {/if}
  </div>
  <div in:fly={{delay: getDelay(true)}}>
    <SecondaryNavItem href={makeSpacePath(url, "threads")}>
      <Icon icon="notes-minimalistic" /> Threads
    </SecondaryNavItem>
  </div>
  <div transition:slide={{delay: getDelay()}}>
    <div class="h-2" />
    <SecondaryNavHeader>Your Rooms</SecondaryNavHeader>
  </div>
  <div transition:slide={{delay: getDelay()}}>
    <SecondaryNavItem href={makeSpacePath(url)}>
      <Icon icon="hashtag" />
      {GENERAL}
    </SecondaryNavItem>
  </div>
  {#each rooms as room, i (room)}
    <div transition:slide={{delay: getDelay()}}>
      <SecondaryNavItem href={makeSpacePath(url, room)}>
        <Icon icon="hashtag" />
        {room}
      </SecondaryNavItem>
    </div>
  {/each}
  {#if otherRooms.length > 0}
    <div transition:slide={{delay: getDelay()}}>
      <div class="h-2" />
      <SecondaryNavHeader>
        {#if rooms.length > 0}
          Other Rooms
        {:else}
          Rooms
        {/if}
      </SecondaryNavHeader>
    </div>
  {/if}
  {#each otherRooms as room, i (room)}
    <div transition:slide={{delay: getDelay()}}>
      <SecondaryNavItem href={makeSpacePath(url, room)}>
        <Icon icon="hashtag" />
        {room}
      </SecondaryNavItem>
    </div>
  {/each}
  <div in:fly={{delay: getDelay()}}>
    <SecondaryNavItem on:click={addRoom}>
      <Icon icon="add-circle" />
      Create room
    </SecondaryNavItem>
  </div>
</SecondaryNavSection>
