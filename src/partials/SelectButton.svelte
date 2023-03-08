<script>
  import cx from "classnames"

  export let options
  export let value
</script>

<div>
  <div class="inline-block">
    <div class="flex cursor-pointer rounded border border-solid border-light">
      {#each options as option, i}
        <div
          class={cx("px-4 py-2 transition-all", {
            "border-l border-solid border-light": i > 0,
            "bg-accent": value === option,
          })}
          on:click={() => {
            value = option
          }}>
          {option}
        </div>
      {/each}
    </div>
  </div>
</div>
