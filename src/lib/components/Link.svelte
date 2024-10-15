<script lang="ts">
  import {goto} from "$app/navigation"

  export let href
  export let external = false

  const go = () => goto(href)
</script>

<a
  {href}
  {...$$props}
  class="cursor-pointer {$$props.class}"
  on:click|preventDefault|stopPropagation={go}
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  <slot />
</a>
