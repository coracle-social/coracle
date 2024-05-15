<script lang="ts">
  import {getAddress} from "@welshman/util"
  import FeedCard from "src/app/shared/FeedCard.svelte"

  export let note
</script>

<FeedCard address={getAddress(note)} />
