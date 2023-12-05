<script lang="ts">
  import cx from "classnames"
</script>

<h2 {...$$props} class={cx($$props.class, "staatliches my-1 text-3xl")}>
  <slot />
</h2>
