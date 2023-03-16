<script>
  import cx from "classnames"
  import {switcher} from "hurdak/lib/hurdak"

  export let theme = "default"
  export let disabled = false

  const className = cx(
    $$props.class,
    "py-2 px-4 rounded cursor-pointer border border-solid transition-all",
    {"text-gray-5": disabled},
    switcher(theme, {
      default: "bg-input text-accent border-gray-6 hover:bg-input-hover",
      accent: "text-white bg-accent border-accent-light hover:bg-accent-light",
    })
  )
</script>

<button on:click {...$$props} class={className}>
  <slot />
</button>
