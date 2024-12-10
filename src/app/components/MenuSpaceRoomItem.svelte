<script lang="ts">
  import {readable} from "svelte/store"
  import Icon from "@lib/components/Icon.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {makeSpacePath} from "@app/routes"
  import {deriveChannel, channelIsLocked} from "@app/state"
  import {deriveNotification, getRoomFilters} from "@app/notifications"

  export let url
  export let room
  export let notify = false

  const path = makeSpacePath(url, room)
  const channel = deriveChannel(url, room)
  const notification = notify
    ? deriveNotification(path, getRoomFilters(room), url)
    : readable(false)
</script>

<SecondaryNavItem href={path} notification={$notification}>
  {#if channelIsLocked($channel)}
    <Icon icon="lock" size={4} />
  {:else}
    <Icon icon="hashtag" />
  {/if}
  <div class="min-w-0 overflow-hidden text-ellipsis">
    <ChannelName {url} {room} />
  </div>
</SecondaryNavItem>
