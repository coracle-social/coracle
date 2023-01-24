<script>
  import cx from 'classnames'

  export let size = "2xl"

  const className = "flex flex-col m-auto text-white gap-6"

  if (!['inherit', 'lg', '2xl'].includes(size)) {
    throw new Error(`Invalid size: ${size}`)
  }
</script>

{#if size === 'inherit'}
<div {...$$props} class={cx($$props.class, className)}>
  <slot />
</div>
{/if}

{#if size === 'lg'}
<div {...$$props} class={cx($$props.class, className, "p-2 py-16 max-w-lg")}>
  <slot />
</div>
{/if}

{#if size === '2xl'}
<div {...$$props} class={cx($$props.class, className, "p-4 max-w-2xl")}>
  <slot />
</div>
{/if}
