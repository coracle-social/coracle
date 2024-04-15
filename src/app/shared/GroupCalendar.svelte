<script lang="ts">
  import {filterFeed} from "@coracle.social/feeds"
  import Calendar from "src/app/shared/Calendar.svelte"

  export let address
</script>

<Calendar group={address} feed={filterFeed({kinds: [31923], "#a": [address]})} />
