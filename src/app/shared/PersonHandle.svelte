<script lang="ts">
  import {nip19} from "nostr-tools"
  import {Nip05} from "src/app/engine"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const handle = Nip05.handles.key(pubkey)
</script>

<div class="overflow-hidden overflow-ellipsis opacity-75">
  {$handle ? Nip05.displayHandle($handle) : npub}
</div>
