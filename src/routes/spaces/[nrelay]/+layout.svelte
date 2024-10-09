<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {sort, ago} from "@welshman/lib"
  import {displayRelayUrl, REACTION, NOTE, EVENT_DATE, EVENT_TIME, CLASSIFIED} from "@welshman/util"
  import {subscribe} from "@welshman/app"
  import {fly, slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import {getMembershipRoomsByUrl, getMembershipUrls, userMembership, pullConservatively, roomsByUrl, decodeNRelay, GENERAL, MESSAGE} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

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

  $: url = decodeNRelay($page.params.nrelay)
  $: rooms = getMembershipRoomsByUrl(url, $userMembership)
  $: otherRooms = ($roomsByUrl.get(url) || []).filter(room => !rooms.concat(GENERAL).includes(room))

  onMount(() => {
    const filter = {kinds: [NOTE, REACTION, MESSAGE, EVENT_DATE, EVENT_TIME, CLASSIFIED]}
    const sub = subscribe({filters: [{...filter, since: ago(30)}]})

    pullConservatively({filters: [filter], relays: [url]})

    return () => sub.close()
  })
</script>

{#key url}
  <SecondaryNav>
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
              {#if getMembershipUrls($userMembership).includes(url)}
                <li class="text-error">
                  <Button on:click={leaveSpace}>
                    <Icon icon="exit" />
                    Leave Space
                  </Button>
                </li>
              {:else}
                <li>
                  <Button on:click={joinSpace}>
                    <Icon icon="login-2" />
                    Join Space
                  </Button>
                </li>
              {/if}
            </ul>
          </Popover>
        {/if}
      </div>
      <div class="my-3 h-px bg-base-200" />
      <div in:fly>
        <SecondaryNavItem href={makeSpacePath(url)}>
          <Icon icon="chat-round" /> Chat
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: getDelay(true)}}>
        <SecondaryNavItem href={makeSpacePath(url, "threads")}>
          <Icon icon="notes-minimalistic" /> Threads
        </SecondaryNavItem>
      </div>
      <div in:fly={{delay: getDelay()}}>
        <SecondaryNavItem href={makeSpacePath(url, "calendar")}>
          <Icon icon="calendar-minimalistic" /> Calendar
        </SecondaryNavItem>
      </div>
      {#if rooms.length > 0}
        <div transition:slide={{delay: getDelay()}}>
          <div class="h-2" />
          <SecondaryNavHeader>Your Rooms</SecondaryNavHeader>
        </div>
      {/if}
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
  </SecondaryNav>
  <Page>
    {#key $page.params.room}
      <slot />
    {/key}
  </Page>
{/key}
