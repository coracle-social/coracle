<script lang="ts">
  import cx from "classnames"

  export let href
  export let external = false
</script>

<a
  {href}
  {...$$props}
  class={cx($$props.class, "cursor-pointer text-primary underline")}
  rel={external ? "noopener noreferer" : ""}
  target={external ? "_blank" : ""}>
  <slot />
</a>
