<script lang="ts">
  export let value
</script>

<span
  class="rounded bg-neutral-700 px-1 py-px font-mono text-sm text-neutral-100 dark:bg-neutral-900"
  class:overflow-auto={value.includes("\n")}
  class:whitespace-pre={value.includes("\n")}
  class:block={value.includes("\n")}>
  {value.trim()}
</span>
