<script lang="ts">
  import {timedelta} from "src/util/misc"
  import Feed from "src/app/shared/Feed.svelte"

  export let pubkey
  export let relays
  export let invertColors = false

  const filter = {kinds: [1, 1985], authors: [pubkey]}
</script>

<Feed {relays} {filter} {invertColors} parentsTimeout={3000} delta={timedelta(1, "days")} />
