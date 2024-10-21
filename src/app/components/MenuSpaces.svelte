<script lang="ts">
  import {page} from "$app/stores"
  import {displayRelayUrl} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import SpaceCreateExternal from "@app/components/SpaceCreateExternal.svelte"
  import SpaceInviteAccept from "@app/components/SpaceInviteAccept.svelte"
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

  const startCreate = () => pushModal(SpaceCreateExternal)

  const startJoin = () => pushModal(SpaceInviteAccept)

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
    <p class="center mb-4 gap-2 text-2xl">
      <Icon icon="compass-big" size={7} />
      <span class="text-primary">{displayRelayUrl(space)}</span>
    </p>
    <div class="grid gap-2 sm:grid-cols-3">
      <Link href={makeSpacePath(space, "threads")} class="btn btn-neutral">
        <Icon icon="notes-minimalistic" /> Threads
      </Link>
      <Link href={makeSpacePath(space)} class="btn btn-neutral">
        <Icon icon="hashtag" />
        {GENERAL}
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
    <div class="grid gap-2 sm:grid-cols-2">
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
    <Button on:click={startJoin}>
      <CardButton>
        <div slot="icon"><Icon icon="login-2" size={7} /></div>
        <div slot="title">Join a space</div>
        <div slot="info">Enter an invite code or url to join an existing space.</div>
      </CardButton>
    </Button>
    <Link href="/discover">
      <CardButton>
        <div slot="icon"><Icon icon="compass" size={7} /></div>
        <div slot="title">Find a space</div>
        <div slot="info">Browse spaces on the discover page.</div>
      </CardButton>
    </Link>
    <Button on:click={startCreate}>
      <CardButton>
        <div slot="icon"><Icon icon="add-circle" size={7} /></div>
        <div slot="title">Create a space</div>
        <div slot="info">Just a few questions and you'll be on your way.</div>
      </CardButton>
    </Button>
  {/if}
</div>
