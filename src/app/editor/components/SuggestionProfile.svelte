<script lang="ts">
  import {npubEncode} from "nostr-tools/nip19"

  export let value
</script>

{npubEncode(value)}
