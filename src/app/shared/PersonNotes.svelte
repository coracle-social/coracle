<script lang="ts">
  import {timedelta} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"

  export let pubkey
  export let relays
  export let invertColors = false

  const filter = {kinds: noteKinds, authors: [pubkey]}
</script>

<Feed {relays} {filter} {invertColors} parentsTimeout={3000} delta={timedelta(3, "days")} />
