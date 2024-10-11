<script lang="ts">
  import cx from "classnames"

  export let href
  export let external = false
</script>

<a
  {href}
  {...$$props}
  on:click|stopPropagation
  class={cx($$props.class, "cursor-pointer")}
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  <slot />
</a>
