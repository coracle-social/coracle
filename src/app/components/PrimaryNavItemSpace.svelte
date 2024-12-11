<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import {makeSpacePath} from "@app/routes"
  import {spacesNotifications} from "@app/notifications"

  export let url

  const path = makeSpacePath(url)
</script>

<PrimaryNavItem
  title={displayRelayUrl(url)}
  href={path}
  class="tooltip-right"
  notification={$spacesNotifications.includes(path)}>
  <SpaceAvatar {url} />
</PrimaryNavItem>
