<script lang="ts">
  export let label
  export let info
</script>

<div class="flex flex-col gap-1">
  <div class="flex gap-2">
    <label class="font-bold">{label}</label>
    <slot />
  </div>
  <p class="text-sm text-gray-4">{info}</p>
</div>
