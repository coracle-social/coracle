<script lang="ts">
  import cx from "classnames"
  import {range} from "hurdak"

  export let inert = false
  export let value = 1
</script>

<div class="flex gap-1">
  {#each range(0, 5) as x}
    <i
      class={cx("fa fa-star text-gray-5", {
        "cursor-pointer hover:text-warning hover:opacity-75": !inert,
        "text-warning": value >= x / 5,
      })}
      on:click={() => {
        value = x / 5
      }} />
  {/each}
</div>
