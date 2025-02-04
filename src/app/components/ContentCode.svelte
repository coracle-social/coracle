<script lang="ts">
  const {value, isBlock} = $props()
</script>

<code
  class="w-full overflow-auto whitespace-pre rounded bg-neutral px-1 text-neutral-content"
  class:block={isBlock}>
  {value.trim()}
</code>
