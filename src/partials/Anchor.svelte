<script>
  import cx from "classnames"
  import {switcher} from "hurdak/lib/hurdak"

  export let type = "anchor"
  export let href

  const className = cx(
    $$props.class,
    switcher(type, {
      anchor: "underline",
      button: "py-2 px-4 rounded bg-white text-accent cursor-pointer",
    }),
  )
</script>

<a on:click {...$$props} {href} class={className}><slot /></a>
