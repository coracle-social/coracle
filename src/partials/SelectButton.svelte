<script lang="ts">
  import cx from "classnames"
  import {identity} from "ramda"

  export let options
  export let value
  export let onChange = null
  export let displayOption = identity
</script>

<div>
  <div class="inline-block">
    <div
      class="flex cursor-pointer overflow-hidden rounded-full border border-solid border-lightest">
      {#each options as option, i}
        <div
          class={cx("px-4 py-2 transition-all", {
            "border-l border-solid border-lightest": i > 0,
            "bg-accent text-white": value === option,
          })}
          on:click={() => {
            value = option
            onChange?.(value)
          }}>
          {displayOption(option)}
        </div>
      {/each}
    </div>
  </div>
</div>
