<script lang="ts">
  import cx from "classnames"

  export let initialValue: string | number = ""
  export let wrapperClass = ""
  export let value = initialValue
  export let element = null
  export let hideBefore = false
  export let hideAfter = false

  const showBefore = $$slots.before && !hideBefore
  const showAfter = $$slots.after && !hideAfter
  const className = cx(
    $$props.class,
    "rounded-full shadow-inset py-2 px-4 w-full placeholder:text-gray-5",
    "bg-input border border-solid border-gray-3 text-black",
    {"pl-10": showBefore, "pr-10": showAfter}
  )

  $: {
    if ($$props.type === "range" && typeof value === "string") {
      value = parseInt(value)
    }
  }
</script>

<div class={cx(wrapperClass, "relative")}>
  <input
    {...$$props}
    class={className}
    bind:value
    bind:this={element}
    on:blur
    on:change
    on:input
    on:keydown />
  {#if showBefore}
    <div class="absolute left-0 top-0 flex gap-2 px-4 pt-3 text-black opacity-75">
      <slot name="before" />
    </div>
  {/if}
  {#if showAfter}
    <div
      class="absolute right-0 top-0 m-px flex gap-2 rounded-full px-4 pt-3 text-black opacity-75">
      <slot name="after" />
    </div>
  {/if}
</div>
