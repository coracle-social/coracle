<script lang="ts">
  import {filter} from "@coracle.social/feeds"
  import Calendar from "src/app/shared/Calendar.svelte"

  export let address
</script>

<Calendar group={address} feed={filter({kinds: [31923], "#a": [address]})} />
