<script>
  import cx from "classnames"
  import {switcher} from "hurdak/lib/hurdak"

  export let external = false
  export let type = "anchor"
  export let href

  const className = cx(
    $$props.class,
    "cursor-pointer",
    switcher(type, {
      anchor: "underline",
      button: "py-2 px-4 rounded bg-white text-accent",
    }),
  )
</script>

<a on:click {...$$props} {href} class={className} target={external ? '_blank noopener' : null}>
  <slot />
</a>
