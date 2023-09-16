<script lang="ts">
  export let label
</script>

<div class="flex flex-col gap-1">
  <div class="flex justify-between">
    <label class="font-bold">{label}</label>
    <slot name="display" />
  </div>
  <slot />
  <p class="text-sm text-gray-4">
    <slot name="info" />
  </p>
</div>
