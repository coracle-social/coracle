<script lang="ts">
  import cx from "classnames"

  export let options
  export let value
  export let onChange = null
</script>

<div>
  <div class="inline-block">
    <div class="flex cursor-pointer overflow-hidden rounded-full border border-solid border-gray-1">
      {#each options as option, i}
        <div
          class={cx("px-4 py-2 transition-all", {
            "border-l border-solid border-gray-1": i > 0,
            "bg-accent text-white": value === option,
          })}
          on:click={() => {
            value = option
            onChange?.(value)
          }}>
          {option}
        </div>
      {/each}
    </div>
  </div>
</div>
