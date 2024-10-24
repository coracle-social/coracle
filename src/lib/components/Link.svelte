<script lang="ts">
  import {goto} from "$app/navigation"

  export let href
  export let external = false
  export let replaceState = false

  const go = (e: Event) => {
    if (!external) {
      e.preventDefault()

      goto(href, {replaceState})
    }
  }
</script>

<a
  {href}
  {...$$props}
  on:click|stopPropagation={go}
  class="cursor-pointer {$$props.class}"
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  <slot />
</a>
