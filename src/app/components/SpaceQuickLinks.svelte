<script lang="ts">
  import {deriveRelay} from "@welshman/app"
  import {fade} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {makeThreadPath, makeCalendarPath, makeRoomPath} from "@app/routes"
  import {
    hasNip29,
    deriveUserRooms,
    deriveOtherRooms,
    makeChannelId,
    channelsById,
  } from "@app/state"
  import {notifications} from "@app/notifications"
  import {pushModal} from "@app/modal"

  type Props = {
    url: string
  }

  const {url}: Props = $props()
  const relay = deriveRelay(url)
  const userRooms = deriveUserRooms(url)
  const otherRooms = deriveOtherRooms(url)
  const threadsPath = makeThreadPath(url)
  const calendarPath = makeCalendarPath(url)

  const addRoom = () => pushModal(RoomCreate, {url})

  const filteredRooms = $derived(() => {
    if (!term) return [...$userRooms, ...$otherRooms]

    const query = term.toLowerCase()
    const allRooms = [...$userRooms, ...$otherRooms]

    return allRooms.filter(room => {
      const channel = $channelsById.get(makeChannelId(url, room))
      const roomName = channel?.name || room
      return roomName.toLowerCase().includes(query)
    })
  })

  let term = $state("")
</script>

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
      <label class="input input-sm input-bordered flex flex-grow items-center gap-2">
        <Icon icon="magnifer" size={4} />
        <input bind:value={term} class="grow" type="text" placeholder="Search rooms..." />
      </label>
    {/if}
    {#each filteredRooms() as room (room)}
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
          <div class="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" transition:fade></div>
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
