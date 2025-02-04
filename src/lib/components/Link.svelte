<script lang="ts">
  import type {Snippet} from "svelte"
  import {goto} from "$app/navigation"
  import {stopPropagation} from "@lib/html"

  const {
    children,
    href,
    external = false,
    replaceState = false,
    ...restProps
  }: {
    children: Snippet
    href: string
    external?: boolean
    replaceState?: boolean
    disabled?: boolean
    class?: string
  } = $props()

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
  onclick={stopPropagation(go)}
  class="cursor-pointer {restProps.class}"
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  {@render children?.()}
</a>
