<script lang="ts">
  import cx from "classnames"
</script>

<div class={cx($$props.class, "flex flex-col items-center justify-center rounded-xl")}>
  <slot />
</div>
