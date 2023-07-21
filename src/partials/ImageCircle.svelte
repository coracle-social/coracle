<script lang="ts">
  import cx from "classnames"

  export let src: string
  export let size = 4
</script>

<div
  class={cx(
    $$props.class,
    `overflow-hidden w-${size} h-${size} inline-block shrink-0 rounded-full border border-solid
     border-gray-1 bg-cover bg-center`
  )}
  style="background-image: url({src}); {$$props.style || ''}">
  <slot />
</div>
