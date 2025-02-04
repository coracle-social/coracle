<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Avatar from "@lib/components/Avatar.svelte"
  import {deriveRelay} from "@welshman/app"

  interface Props {
    url?: string
  }

  const {url = ""}: Props = $props()

  const relay = deriveRelay(url)
</script>

<Avatar
  icon="remote-controller-minimalistic"
  class="!h-10 !w-10"
  alt={displayRelayUrl(url)}
  src={$relay?.profile?.icon} />
