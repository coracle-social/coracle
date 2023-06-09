<script lang="ts">
  import {range} from "hurdak/lib/hurdak"

  export let value = 1
</script>

<div class="flex gap-1">
  {#each range(0, 5) as x}
    <i
      class="fa fa-star cursor-pointer text-gray-5 hover:text-warning hover:opacity-75"
      class:text-warning={value >= x / 5}
      on:click={() => {
        value = x / 5
      }} />
  {/each}
</div>
