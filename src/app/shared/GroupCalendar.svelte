<script lang="ts">
  import {feedFromFilter} from "@welshman/feeds"
  import Calendar from "src/app/shared/Calendar.svelte"

  export let address
</script>

<Calendar group={address} feed={feedFromFilter({kinds: [31923], "#a": [address]})} />
