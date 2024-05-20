<script lang="ts">
  export let value
</script>

<span
  class="bg-neutral-900 px-1 rounded text-sm py-px font-mono whitespace-pre"
  class:block={value.includes('\n')}>
  {value.trim()}
</span>
