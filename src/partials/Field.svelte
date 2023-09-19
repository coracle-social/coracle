<script lang="ts">
  export let label = null
  export let icon = null
</script>

<div class="flex flex-col gap-1">
  <slot name="label">
    <div class="flex justify-between">
      <label class="font-bold">
        {#if icon}
          <i class={`fa ${icon}`} />
        {/if}
        {label}
      </label>
      <slot name="display" />
    </div>
  </slot>
  <slot />
  <p class="text-sm text-gray-4">
    <slot name="info" />
  </p>
</div>
