<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveRelay} from "@welshman/app"

  export let url

  const relay = deriveRelay(url)
</script>

<Avatar
  icon="remote-controller-minimalistic"
  class="!h-10 !w-10 border border-solid border-base-300"
  alt={displayRelayUrl(url)}
  src={$relay?.profile?.icon} />
