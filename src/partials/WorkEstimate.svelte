<script lang="ts">
  import {benchmark, estimateWork} from "src/util/pow"

  export let difficulty

  // estimateWork kicks the benchmark off on first use and reads its result synchronously, so
  // depend on the store as well or a first-ever visit stays on "Calculating..." forever.
  $: ms = (void $benchmark, estimateWork(difficulty))
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
