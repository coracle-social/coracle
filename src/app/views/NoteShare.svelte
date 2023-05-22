<script lang="ts">
  import {nip19} from "nostr-tools"
  import {toNostrURI} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import {getRelayForEventHint} from "src/agent/relays"

  export let note

  const nevent = nip19.neventEncode({id: note.id, relays: [getRelayForEventHint(note)]})
</script>

<Content size="lg">
  <QRCode code={toNostrURI(nevent)} />
  <div class="text-center text-gray-1">Copy or scan from a nostr app to share this note.</div>
</Content>
