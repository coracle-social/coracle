<script lang="ts">
  import {nip19} from "nostr-tools"
  import {toNostrURI} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import {nip65} from "src/app/engine"

  export let pubkey

  const relays = nip65.getPubkeyHints(3, pubkey)
  const nprofile = nip19.nprofileEncode({pubkey, relays})
</script>

<Content size="lg">
  <QRCode code={toNostrURI(nprofile)} />
  <div class="text-center text-gray-1">Copy or scan from a nostr app to share this profile.</div>
</Content>
