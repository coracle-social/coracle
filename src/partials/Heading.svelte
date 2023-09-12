<script lang="ts">
  import cx from "classnames"
</script>

<h1 {...$$props} class={cx($$props.class, "staatliches my-4 text-6xl")}>
  <slot />
</h1>
