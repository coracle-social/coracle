<script lang="ts">
  import {getAddress} from "paravel"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"

  export let note
</script>

<GroupSummary address={getAddress(note)} />
