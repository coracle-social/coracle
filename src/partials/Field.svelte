<script lang="ts">
  export let label
  export let info
</script>

<div class="flex flex-col gap-1">
  <div class="flex justify-between">
    <label class="font-bold">{label}</label>
    <slot name="display" />
  </div>
  <slot />
  {#if info}
    <p class="text-sm text-gray-4">{info}</p>
  {/if}
</div>
