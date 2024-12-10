<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {makeSpacePath} from "@app/routes"
  import {deriveNotification, getRoomFilters} from "@app/notifications"

  export let url
  export let room

  const path = makeSpacePath(url, room)
  const notification = deriveNotification(path, getRoomFilters(room), url)
</script>

<SecondaryNavItem href={path} notification={$notification}>
  <Icon icon="hashtag" />
  <ChannelName {url} {room} />
</SecondaryNavItem>
