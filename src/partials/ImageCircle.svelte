<script lang="ts">
  import cx from 'classnames'

  export let src
  export let size = 4
</script>

<div
  class={cx($$props.class, `overflow-hidden w-${size} h-${size} rounded-full bg-cover bg-center shrink-0 border border-solid border-white`)}
  style="background-image: url({src})" />
