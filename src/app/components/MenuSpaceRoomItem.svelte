<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {makeRoomPath} from "@app/routes"
  import {deriveChannel, channelIsLocked} from "@app/state"
  import {notifications} from "@app/notifications"

  export let url
  export let room
  export let notify = false

  const path = makeRoomPath(url, room)
  const channel = deriveChannel(url, room)
</script>

<SecondaryNavItem href={path} notification={notify ? $notifications.has(path) : false}>
  {#if channelIsLocked($channel)}
    <Icon icon="lock" size={4} />
  {:else}
    <Icon icon="hashtag" />
  {/if}
  <div class="min-w-0 overflow-hidden text-ellipsis">
    <ChannelName {url} {room} />
  </div>
</SecondaryNavItem>
