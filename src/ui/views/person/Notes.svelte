<script lang="ts">
  import {timedelta} from "src/util/misc"
  import Feed from "src/ui/views/feed/Feed.svelte"

  export let pubkey
  export let relays

  const filter = {kinds: [1], authors: [pubkey]}
</script>

<Feed {relays} {filter} parentsTimeout={3000} delta={timedelta(1, "days")} />
