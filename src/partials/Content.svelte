<script>
  import cx from 'classnames'

  export let size = "2xl"

  const className = "flex flex-col m-auto text-white gap-8"

  if (!['lg', '2xl'].includes(size)) {
    throw new Error(`Invalid size: ${size}`)
  }
</script>

{#if size === 'lg'}
<div {...$$props} class={cx($$props.class, className, "p-2 py-16 max-w-lg")}>
  <slot />
</div>
{/if}

{#if size === '2xl'}
<div {...$$props} class={cx($$props.class, className, "py-8 p-4 max-w-2xl")}>
  <slot />
</div>
{/if}
