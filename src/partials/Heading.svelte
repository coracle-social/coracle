<script>
  import cx from 'classnames'
</script>

<h1 {...$$props} class={cx($$props.class, "staatliches text-6xl my-4")}><slot /></h1>
