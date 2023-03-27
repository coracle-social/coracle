<script lang="ts">
  import {timedelta} from "src/util/misc"
  import Feed from "src/views/feed/Feed.svelte"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"

  export let pubkey

  const relays = sampleRelays(getPubkeyWriteRelays(pubkey))
  const filter = {kinds: [1], authors: [pubkey]}
</script>

<Feed {relays} {filter} parentsTimeout={3000} delta={timedelta(1, "days")} />
