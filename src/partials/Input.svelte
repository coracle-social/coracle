<script lang="ts">
  import cx from "classnames"
  import {identity} from "ramda"

  export let initialValue: string | number = ""
  export let wrapperClass = ""
  export let value = initialValue
  export let element = null
  export let hideBefore = false
  export let hideAfter = false
  export let format: (x: any) => string = identity
  export let parse: (x: string) => any = identity

  const showBefore = $$slots.before && !hideBefore
  const showAfter = $$slots.after && !hideAfter
  const className = cx(
    $$props.class,
    "rounded shadow-inset py-2 px-4 w-full placeholder:text-neutral-200",
    "bg-white text-black",
    {"pl-10": showBefore, "pr-10": showAfter},
  )

  const onInput = e => {
    value = parse(e.target.value)
  }

  $: inputValue = format(value)
</script>

<div class={cx(wrapperClass, "relative")}>
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
    <div class="absolute left-0 top-0 flex gap-2 px-4 pt-2 text-black opacity-75">
      <div>
        <slot name="before" />
      </div>
    </div>
  {/if}
  {#if showAfter}
    <div
      class="absolute right-0 top-0 m-px flex gap-2 rounded-full px-4 pt-2 text-black opacity-75">
      <div>
        <slot name="after" />
      </div>
    </div>
  {/if}
</div>
