<script lang="ts">
  import cx from "classnames"

  export let small = false
  export let large = false

  const className = cx('flex flex-col m-auto', $$props.class, {
    'gap-2': small,
    'gap-4': !small && !large,
    'gap-6': large,
  })
</script>

<div {...$$props} class={className}>
  <slot />
</div>
