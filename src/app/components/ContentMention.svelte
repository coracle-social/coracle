<script lang="ts">
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import {pubkeyLink} from "@app/state"

  export let value

  const profile = deriveProfile(value.pubkey)
</script>

<Link external href={pubkeyLink(value.pubkey)} class="link-content">
  @{displayProfile($profile)}
</Link>
