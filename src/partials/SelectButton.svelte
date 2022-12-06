<script>
  import cx from "classnames"

  export let options
  export let value
</script>

<div>
  <div class="inline-block">
    <div class="rounded flex border border-solid border-light cursor-pointer">
      {#each options as option, i}
      <span
        class={cx("px-4 py-2", {
          "border-l border-solid border-light": i > 0,
          "bg-accent": value === option,
        })}
        on:click={() => { value = option }}>
        {option}
      </span>
      {/each}
    </div>
  </div>
</div>
