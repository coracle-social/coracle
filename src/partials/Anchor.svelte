<script>
  import cx from "classnames"
  import {switcher} from "hurdak/lib/hurdak"

  export let external = false
  export let loading = false
  export let type = "anchor"
  export let href = null

  let className

  $: className = cx(
    $$props.class,
    "cursor-pointer transition-all",
    {"opacity-50": loading},
    switcher(type, {
      anchor: "underline",
      button:
        "py-2 px-4 rounded bg-input text-accent whitespace-nowrap border border-solid border-gray-6 hover:bg-input-hover",
      "button-circle":
        "w-10 h-10 flex justify-center items-center rounded-full bg-input text-accent whitespace-nowrap border border-solid border-gray-6 hover:bg-input-hover",
      "button-accent":
        "py-2 px-4 rounded bg-accent text-white whitespace-nowrap border border-solid border-accent-light hover:bg-accent-light",
    })
  )
</script>

<a on:click {...$$props} {href} class={className} target={external ? "_blank" : null}>
  <slot />
</a>
