<script lang="ts">
  import {pluck} from "ramda"
  import {nip19} from "nostr-tools"
  import Content from "src/partials/Content.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import {getPubkeyWriteRelays} from "src/agent/relays"

  export let person

  const {pubkey} = person
  const relays = pluck("url", getPubkeyWriteRelays(pubkey).slice(0, 5))
  const nprofile = nip19.nprofileEncode({pubkey, relays})
</script>

<Content size="lg">
  <QRCode code={`nostr:${nprofile}`} />
  <div class="text-center text-gray-1">Copy or scan from a nostr app to share this profile.</div>
</Content>
