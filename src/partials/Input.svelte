<script lang="ts">
  import cx from "classnames"
  import {identity} from "ramda"

  export let initialValue: string | number = ""
  export let value = initialValue
  export let element = null
  export let hideBefore = false
  export let hideAfter = false
  export let format: (x: any) => string = identity
  export let parse: (x: string) => any = identity
  export let dark = false

  const showBefore = $$slots.before && !hideBefore
  const showAfter = $$slots.after && !hideAfter
  const className = cx(
    "outline-none px-3 w-full placeholder:text-neutral-400 h-7 bg-transparent",
    {"pl-10": showBefore, "pr-10": showAfter},
  )

  const onInput = e => {
    value = parse(e.target.value)
  }

  $: inputValue = format(value)
</script>

<div
  class={cx($$props.class, "shadow-inset relative rounded h-7 overflow-hidden", {
    "bg-neutral-900 text-neutral-100": dark,
    "bg-white dark:text-neutral-900": !dark,
  })}>
  <input
    {...$$props}
    class={className}
    value={inputValue}
    bind:this={element}
    on:input={onInput}
    on:change
    on:blur
    on:focus
    on:input
    on:keydown />
  {#if showBefore}
    <div class="absolute left-0 top-0 flex items-center gap-2 px-3 opacity-75 h-7">
      <div>
        <slot name="before" />
      </div>
    </div>
  {/if}
  {#if showAfter}
    <div class="absolute right-0 top-0 m-px flex items-center gap-2 rounded-full px-3 opacity-75 h-7">
      <div>
        <slot name="after" />
      </div>
    </div>
  {/if}
</div>
