<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAvatar from "@app/components/SpaceAvatar.svelte"
  import {makeSpacePath} from "@app/routes"
  import {deriveNotification, SPACE_FILTERS} from "@app/notifications"

  export let url

  const path = makeSpacePath(url)
  const notification = deriveNotification(path, SPACE_FILTERS, url)
</script>

<PrimaryNavItem
  title={displayRelayUrl(url)}
  href={path}
  class="tooltip-right"
  notification={$notification}>
  <SpaceAvatar {url} />
</PrimaryNavItem>
