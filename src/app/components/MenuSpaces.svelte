<script lang="ts">
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {displayRelayUrl} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceAdd from "@app/components/SpaceAdd.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import {
    GENERAL,
    userMembership,
    decodeRelay,
    getMembershipRoomsByUrl,
    getMembershipUrls,
    roomsByUrl,
  } from "@app/state"
  import {makeSpacePath} from "@app/routes"
  import {pushModal} from "@app/modal"

  let space = $page.params?.relay ? decodeRelay($page.params?.relay) : undefined
  let showSettings = false

  const assertNotNil = <T,>(x: T) => x!

  const resetSpace = () => {
    space = ""
  }

  const setSpace = (url: string) => {
    space = url
  }

  const openSettings = () => {
    showSettings = true
  }

  const closeSettings = () => {
    showSettings = false
  }

  const addSpace = () => pushModal(SpaceAdd)

  const browseSpaces = () => goto("/discover")

  const leaveSpace = () => pushModal(SpaceExit, {url: space})

  const joinSpace = () => pushModal(SpaceJoin, {url: space})

  const addRoom = () => pushModal(RoomCreate, {url: space})

  $: rooms = space ? getMembershipRoomsByUrl(space, $userMembership) : []
  $: allRooms = $roomsByUrl.get(space || "") || []
  $: otherRooms = allRooms.filter(room => !rooms.concat(GENERAL).includes(room))
</script>

<div class="column menu gap-2">
  {#if showSettings}
    <p class="mb-4 text-center text-2xl">
      Settings for <span class="text-primary">{displayRelayUrl(assertNotNil(space))}</span>
    </p>
    {#if getMembershipUrls($userMembership).includes(space || "")}
      <Button on:click={leaveSpace} class="btn btn-error">
        <Icon icon="exit" />
        Leave Space
      </Button>
    {:else}
      <Button on:click={joinSpace} class="btn btn-primary">
        <Icon icon="login-2" />
        Join Space
      </Button>
    {/if}
    <Button on:click={closeSettings} class="mt-4 flex items-center gap-2 text-lg">
      <Icon icon="alt-arrow-left" size={7} />
      Go Back
    </Button>
  {:else if space}
    <p class="mb-4 text-center text-2xl">
      Actions for <span class="text-primary">{displayRelayUrl(space)}</span>
    </p>
    <div class="grid grid-cols-3 gap-2">
      <Link href={makeSpacePath(space)} class="btn btn-neutral">
        <Icon icon="chat-round" /> Chat
      </Link>
      <Link href={makeSpacePath(space, "threads")} class="btn btn-neutral">
        <Icon icon="notes-minimalistic" /> Threads
      </Link>
      <Link href={makeSpacePath(space, "calendar")} class="btn btn-neutral">
        <Icon icon="calendar-minimalistic" /> Calendar
      </Link>
      {#each rooms as room, i (room)}
        <Link href={makeSpacePath(space, room)} class="btn btn-neutral">
          <Icon icon="hashtag" />
          {room}
        </Link>
      {/each}
      {#each otherRooms as room, i (room)}
        <Link href={makeSpacePath(space, room)} class="btn">
          <Icon icon="hashtag" />
          {room}
        </Link>
      {/each}
    </div>
    <div class="grid grid-cols-2 gap-2">
      <Button on:click={addRoom} class="btn btn-primary">
        <Icon icon="add-circle" />
        Create Room
      </Button>
      <Button on:click={openSettings} class="btn">
        <Icon icon="settings" /> Space Settings
      </Button>
    </div>
    <Button on:click={resetSpace} class="mt-4 flex items-center gap-2 text-lg">
      <Icon icon="alt-arrow-left" size={7} />
      Back to Spaces
    </Button>
  {:else}
    {#each getMembershipUrls($userMembership) as url (url)}
      <Button on:click={() => setSpace(url)}>
        <CardButton>
          <div slot="icon"><SpaceAvatar {url} /></div>
          <div slot="title"><RelayName {url} /></div>
          <div slot="info"><RelayDescription {url} /></div>
        </CardButton>
      </Button>
    {/each}
    {#if getMembershipUrls($userMembership).length > 0}
      <Divider />
    {/if}
    <Button on:click={addSpace}>
      <CardButton>
        <div slot="icon"><Icon icon="add-circle" size={7} /></div>
        <div slot="title">Add a space</div>
        <div slot="info">Invite all your friends, do life together.</div>
      </CardButton>
    </Button>
    <Button on:click={browseSpaces}>
      <CardButton>
        <div slot="icon"><Icon icon="compass" size={7} /></div>
        <div slot="title">Discover spaces</div>
        <div slot="info">Find a community based on your hobbies or interests.</div>
      </CardButton>
    </Button>
  {/if}
</div>
