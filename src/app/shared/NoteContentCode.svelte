<script lang="ts">
  export let value
</script>

<span
  class="overflow-auto whitespace-pre rounded bg-neutral-700 px-1 py-px font-mono text-sm text-neutral-100 dark:bg-neutral-900"
  class:block={value.includes("\n")}>
  {value.trim()}
</span>
