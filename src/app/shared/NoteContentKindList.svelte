<script lang="ts">
  import {getAddress} from "@welshman/util"
  import ListCard from "src/app/shared/ListCard.svelte"

  export let note
</script>

<ListCard address={getAddress(note)} />
