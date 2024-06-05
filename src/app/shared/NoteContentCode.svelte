<script lang="ts">
  export let value
</script>

<span
  class="text-neutral-100 bg-neutral-700 dark:bg-neutral-900 px-1 rounded text-sm py-px font-mono whitespace-pre overflow-auto"
  class:block={value.includes('\n')}>
  {value.trim()}
</span>
