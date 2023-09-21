<script lang="ts">
  import {nip19} from "nostr-tools"
  import {people, displayHandle} from "src/engine"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const person = people.key(pubkey)
</script>

<div class="overflow-hidden overflow-ellipsis opacity-75">
  {$person?.handle ? displayHandle($person.handle) : npub}
</div>
