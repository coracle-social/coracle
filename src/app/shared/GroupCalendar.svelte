<script lang="ts">
  import {EVENT_TIME} from "@welshman/util"
  import Calendar from "src/app/shared/Calendar.svelte"

  export let address
</script>

<Calendar group={address} filter={{kinds: [EVENT_TIME], "#a": [address]}} />
