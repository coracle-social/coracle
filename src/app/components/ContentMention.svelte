<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {displayProfile} from "@welshman/util"
  import {deriveProfile} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import {nostr} from '@app/state'

  export let value

  const profile = deriveProfile(value.pubkey)
  const nprofile = nip19.nprofileEncode(value)
</script>

<Link external href={nostr(nprofile)} class="link-content">
  @{displayProfile($profile)}
</Link>
