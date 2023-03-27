<script lang="ts">
  import cx from "classnames"

  export let initialValue: string | number = ""
  export let wrapperClass = ""
  export let value = initialValue

  const className = cx(
    $$props.class,
    "rounded shadow-inset py-2 px-4 pr-10 w-full placeholder:text-gray-5",
    "bg-input border border-solid border-gray-3 text-black",
    {"pl-10": $$slots.before, "pr-10": $$slots.after}
  )
</script>

<div class={cx(wrapperClass, "relative")}>
  <input {...$$props} class={className} bind:value on:change on:input />
  {#if $$slots.before}
    <div class="absolute top-0 left-0 flex gap-2 px-3 pt-3 text-black opacity-75">
      <slot name="before" />
    </div>
  {/if}
  {#if $$slots.after}
    <div class="absolute top-0 right-0 m-px flex gap-2 rounded px-3 pt-3 text-black opacity-75">
      <slot name="after" />
    </div>
  {/if}
</div>
