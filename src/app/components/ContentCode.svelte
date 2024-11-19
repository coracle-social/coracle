<script lang="ts">
  export let value
  export let isBlock
</script>

<code
  class="w-full overflow-auto whitespace-pre rounded bg-neutral p-2 text-neutral-content"
  class:block={isBlock}>
  {value.trim()}
</code>
