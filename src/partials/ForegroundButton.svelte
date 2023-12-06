<script lang="ts">
  import cx from 'classnames'

  export let size = "large"
  export let theme = "primary"

  const className = cx(
    $$props.class,
    "flex items-center justify-center rounded-full border shadow-2xl",
    "transition-all hover:scale-105",
    {
      "h-12 w-12": size === 'small',
      "h-16 w-16": size === 'large',
      "text-white border-accent-l bg-accent hover:bg-accent-l": theme === 'primary',
      "border-dark bg-cocoa text-lightest hover:bg-mid": theme === 'secondary'
    }
   )
</script>

<button on:click class={className}>
  <slot />
</button>
