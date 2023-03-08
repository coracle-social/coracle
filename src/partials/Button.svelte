<script>
  import cx from "classnames"
  import {switcher} from "hurdak/lib/hurdak"

  export let theme = "default"
  export let disabled = false

  const className = cx(
    $$props.class,
    "py-2 px-4 rounded cursor-pointer",
    {"text-light": disabled},
    switcher(theme, {
      default: "bg-white text-accent",
      accent: "text-white bg-accent",
    })
  )
</script>

<button on:click {...$$props} class={className}>
  <slot />
</button>
