<script lang="ts">
  import {Naddr} from 'src/util/nostr'
  import GroupSummary from "src/app/shared/GroupSummary.svelte"

  export let note
</script>

<GroupSummary address={Naddr.fromEvent(note).asTagValue()} />
