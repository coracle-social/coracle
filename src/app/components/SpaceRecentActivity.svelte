<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {makeChannelId, channelsById, deriveUserRooms} from "@app/state"

  interface Props {
    url: string
  }

  const {url}: Props = $props()

  const userRooms = deriveUserRooms(url)
</script>

<div class="card2 bg-alt">
  <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
    <Icon icon="chat-round" />
    Recent Activity
  </h3>
  <div class="flex flex-col gap-3">
    {#if $userRooms.length > 0}
      {#each $userRooms.slice(0, 3) as room (room)}
        {@const channel = $channelsById.get(makeChannelId(url, room))}
        <div class="flex items-center gap-3 rounded bg-base-100">
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
