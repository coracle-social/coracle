<script lang="ts">
  import {page} from "$app/stores"
  import type {TrustedEvent} from "@welshman/util"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import {fade} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import PageContent from "@lib/components/PageContent.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ProfileFeed from "@app/components/ProfileFeed.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import {
    hasNip29,
    decodeRelay,
    makeChannelId,
    channelsById,
    deriveUserRooms,
    deriveOtherRooms,
    userRoomsByUrl,
  } from "@app/state"
  import {makeChatPath, makeThreadPath, makeCalendarPath, makeRoomPath} from "@app/routes"
  import {notifications} from "@app/notifications"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const relay = deriveRelay(url)
  const userRooms = deriveUserRooms(url)
  const otherRooms = deriveOtherRooms(url)
  const threadsPath = makeThreadPath(url)
  const calendarPath = makeCalendarPath(url)

  const joinSpace = () => pushModal(SpaceJoin, {url})

  const addRoom = () => pushModal(RoomCreate, {url})

  let relayAdminEvents: TrustedEvent[] = $state([])
  let roomSearchQuery = $state("")

  const pubkey = $derived($relay?.profile?.pubkey)

  const filteredRooms = $derived(() => {
    if (!roomSearchQuery) return [...$userRooms, ...$otherRooms]

    const query = roomSearchQuery.toLowerCase()
    const allRooms = [...$userRooms, ...$otherRooms]

    return allRooms.filter(room => {
      const channel = $channelsById.get(makeChannelId(url, room))
      const roomName = channel?.name || room
      return roomName.toLowerCase().includes(query)
    })
  })
</script>

<PageBar>
  {#snippet icon()}
    <div class="center">
      <Icon icon="home-smile" />
    </div>
  {/snippet}
  {#snippet title()}
    <strong>Home</strong>
  {/snippet}
  {#snippet action()}
    <div class="row-2">
      {#if !$userRoomsByUrl.has(url)}
        <Button class="btn btn-primary btn-sm" onclick={joinSpace}>
          <Icon icon="login-2" />
          Join Space
        </Button>
      {:else if pubkey}
        <Link class="btn btn-primary btn-sm" href={makeChatPath([pubkey])}>
          <Icon icon="letter" />
          Contact Owner
        </Link>
      {/if}
      <MenuSpaceButton {url} />
    </div>
  {/snippet}
</PageBar>

<PageContent class="flex flex-col gap-2 p-2 pt-4">
  <div class="card2 bg-alt flex flex-col gap-4 text-left">
    <div class="relative flex gap-4">
      <div class="relative">
        <div class="avatar relative">
          <div
            class="center !flex h-16 w-16 min-w-16 rounded-full border-2 border-solid border-base-300 bg-base-300">
            {#if $relay?.profile?.icon}
              <img alt="" src={$relay.profile.icon} />
            {:else}
              <Icon icon="ghost" size={6} />
            {/if}
          </div>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <h1 class="ellipsize whitespace-nowrap text-2xl font-bold">
          <RelayName {url} />
        </h1>
        <p class="ellipsize mb-2 text-sm opacity-75">{displayRelayUrl(url)}</p>
        {#if $relay?.profile?.pubkey}
          <p class="text-sm opacity-60">
            <Icon icon="user-rounded" size={4} class="mr-1 inline" />
            Relay Admin: {$relay.profile.pubkey.slice(0, 8)}...{$relay.profile.pubkey.slice(-8)}
          </p>
        {/if}
      </div>
    </div>
    <div class="mt-4">
      <RelayDescription {url} />
    </div>
  </div>
  <div class="card2 bg-alt md:hidden">
    <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
      <Icon icon="compass-big" />
      Quick Links
    </h3>
    <div class="flex flex-col gap-2">
      <Link href={threadsPath} class="btn btn-primary w-full justify-start">
        <div class="relative flex items-center gap-2">
          <Icon icon="notes-minimalistic" />
          Threads
          {#if $notifications.has(threadsPath)}
            <div
              class="absolute -right-3 -top-1 h-2 w-2 rounded-full bg-primary-content"
              transition:fade>
            </div>
          {/if}
        </div>
      </Link>
      <Link href={calendarPath} class="btn btn-secondary w-full justify-start">
        <div class="relative flex items-center gap-2">
          <Icon icon="calendar-minimalistic" />
          Calendar
          {#if $notifications.has(calendarPath)}
            <div
              class="absolute -right-3 -top-1 h-2 w-2 rounded-full bg-primary-content"
              transition:fade>
            </div>
          {/if}
        </div>
      </Link>
      {#if $userRooms.length + $otherRooms.length > 10}
        <div class="mt-4">
          <input
            type="text"
            placeholder="Search rooms..."
            class="input input-sm mb-2 w-full"
            bind:value={roomSearchQuery} />
        </div>
      {/if}
      {#each ($userRooms.length + $otherRooms.length > 10 ? filteredRooms() : [...$userRooms, ...$otherRooms]).slice(0, 10) as room (room)}
        {@const roomPath = makeRoomPath(url, room)}
        {@const channel = $channelsById.get(makeChannelId(url, room))}
        <Link href={roomPath} class="btn btn-neutral btn-sm relative w-full justify-start">
          <div class="flex min-w-0 items-center gap-2 overflow-hidden text-nowrap">
            {#if channel?.closed || channel?.private}
              <Icon icon="lock" size={4} />
            {:else}
              <Icon icon="hashtag" />
            {/if}
            <ChannelName {url} {room} />
          </div>
          {#if $notifications.has(roomPath)}
            <div class="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" transition:fade>
            </div>
          {/if}
        </Link>
      {/each}
      {#if hasNip29($relay)}
        <Button onclick={addRoom} class="btn btn-neutral btn-sm w-full justify-start">
          <Icon icon="add-circle" />
          Create Room
        </Button>
      {/if}
    </div>
  </div>
  <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
    <div class="flex flex-col gap-2">
      {#if pubkey}
        <div class="card2 bg-alt">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon icon="user-rounded" />
            Recent Posts from Relay Admin
          </h3>
          <div class="flex flex-col gap-3">
            {#if relayAdminEvents.length > 0}
              <ProfileFeed hideLoading {url} {pubkey} bind:events={relayAdminEvents} />
            {:else}
              <p class="text-sm opacity-60">No recent posts from the relay admin</p>
            {/if}
          </div>
        </div>
      {/if}
      <div class="card2 bg-alt">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon icon="chat-round" />
          Recent Activity
        </h3>
        <div class="flex flex-col gap-3">
          {#if $userRooms.length > 0}
            {#each $userRooms.slice(0, 3) as room (room)}
              {@const channel = $channelsById.get(makeChannelId(url, room))}
              <div class="flex items-center gap-3 rounded bg-base-100 p-2">
                <div class="flex items-center gap-2">
                  {#if channel?.closed || channel?.private}
                    <Icon icon="lock" size={4} />
                  {:else}
                    <Icon icon="hashtag" />
                  {/if}
                  <span class="font-medium">
                    <ChannelName {url} {room} />
                  </span>
                </div>
                <span class="ml-auto text-sm opacity-60">Active conversations</span>
              </div>
            {/each}
          {:else}
            <p class="text-sm opacity-60">No recent activity</p>
          {/if}
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-6">
      <div class="card2 bg-alt">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon icon="server" />
          Relay Status
        </h3>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full bg-green-500"></div>
            <span class="text-sm">Connected</span>
          </div>
          {#if $relay?.profile}
            {@const {software, version, supported_nips, limitation} = $relay.profile}
            <div class="flex flex-wrap gap-1">
              {#if $relay?.profile?.contact}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Contact: {$relay.profile.contact}</span>
                </div>
              {/if}
              {#if software}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Software: {software}</span>
                </div>
              {/if}
              {#if version}
                <div class="badge badge-neutral">
                  <span class="ellipsize">Version: {version}</span>
                </div>
              {/if}
              {#if Array.isArray(supported_nips)}
                <p class="badge badge-neutral">
                  <span class="ellipsize">Supported NIPs: {supported_nips.join(", ")}</span>
                </p>
              {/if}
              {#if limitation?.auth_required}
                <p class="badge badge-warning">
                  <span class="ellipsize">Auth Required</span>
                </p>
              {/if}
              {#if limitation?.payment_required}
                <p class="badge badge-warning">
                  <span class="ellipsize">Payment Required</span>
                </p>
              {/if}
              {#if limitation?.min_pow_difficulty}
                <p class="badge badge-warning">
                  <span class="ellipsize">Min PoW: {limitation?.min_pow_difficulty}</span>
                </p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</PageContent>
