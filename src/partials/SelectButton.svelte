<script lang="ts">
  import cx from "classnames"
  import {without} from 'ramda'

  export let options
  export let value
  export let onChange = null
  export let disabled = false
  export let multiple = false
  export let displayOption = x => x
</script>

<div>
  <div class="inline-block">
    <div
      class="flex overflow-hidden rounded-full border border-solid border-neutral-100"
      class:pointer-events-none={disabled}
      class:opacity-75={disabled}
      class:cursor-pointer={!disabled}>
      {#each options as option, i}
        <div
          class={cx("px-4 py-2 transition-all", {
            "border-l border-solid border-neutral-100": i > 0,
            "bg-accent text-white": multiple ? value.includes(option) : value === option,
          })}
          on:click={() => {
            if (multiple) {
              value = value.includes(option) ? without([option], value) : [...value, option]
            } else {
              value = option
            }

            onChange?.(value)
          }}>
          {displayOption(option)}
        </div>
      {/each}
    </div>
  </div>
</div>
