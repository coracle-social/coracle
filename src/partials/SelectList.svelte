<script lang="ts">
  import cx from "classnames"
  import {without} from 'ramda'

  export let options
  export let value
  export let onChange = null
  export let disabled = false
  export let multiple = false

  const onClick = option => {
    if (multiple) {
      value = value.includes(option) ? without([option], value) : [...value, option]
    } else {
      value = option
    }

    onChange?.(value)
  }
</script>

<div
  class={$$props.class}
  class:pointer-events-none={disabled}
  class:opacity-75={disabled}
  class:cursor-pointer={!disabled}>
  {#each options as option, i}
    <div on:click={() => onClick(option)}>
      <slot name="item" {i} {option} active={multiple ? value.includes(option) : value === option} />
    </div>
  {/each}
</div>
