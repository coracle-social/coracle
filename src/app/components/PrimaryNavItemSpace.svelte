<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import {makeSpacePath} from "@app/routes"
  import {notifications} from "@app/notifications"

  const {url} = $props()

  const path = makeSpacePath(url)
</script>

<PrimaryNavItem
  title={displayRelayUrl(url)}
  href={path}
  class="tooltip-right"
  notification={$notifications.has(path)}>
  <SpaceAvatar {url} />
</PrimaryNavItem>
