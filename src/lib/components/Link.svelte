<script lang="ts">
  import {goto} from "$app/navigation"

  interface Props {
    href: string
    external: boolean
    replaceState: boolean
  }

  let {href, external = false, replaceState = false, ...restProps} = $props()

  const go = (e: Event) => {
    if (!external) {
      e.preventDefault()

      goto(href, {replaceState})
    }
  }
</script>

<a
  {href}
  {...restProps}
  on:click|stopPropagation={go}
  class="cursor-pointer {restProps.class}"
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  <slot />
</a>
