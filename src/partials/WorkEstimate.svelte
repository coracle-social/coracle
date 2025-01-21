<script lang="ts">
  import {estimateWork} from "src/util/pow"

  export let difficulty

  $: ms = estimateWork(difficulty)
</script>

{#if ms === 0}
  Calculating...
{:else if ms < 1000}
  ~{ms} ms
{:else if ms < 60 * 3 * 1000}
  ~{Math.ceil(ms / 1000)} seconds
{:else}
  ~{Math.ceil(ms / 1000 / 60)} minutes
{/if}
