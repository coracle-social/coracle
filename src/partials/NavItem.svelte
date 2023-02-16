<script lang="ts">
  import cx from 'classnames'

  export let href
  export let icon
  export let inert = false
</script>

<li class={cx($$props.class, {'transition-all hover:bg-accent': !inert}, "cursor-pointer")}>
  <a {href} class="px-4 py-2 flex gap-2 items-center">
    <i class={`fa fa-${icon}`} />
    <slot />
  </a>
</li>
