<script lang="ts">
  export let label = null
  export let icon = null
</script>

<div class="flex flex-col gap-2">
  <slot name="label">
    <div class="grid grid-cols-2 gap-2">
      <label class="flex items-center gap-2 font-bold">
        {#if icon}
          <i class={`fa ${icon}`} />
        {/if}
        <span>{label}</span>
      </label>
      <slot />
    </div>
  </slot>
  <p class="text-sm text-neutral-200">
    <slot name="info" />
  </p>
</div>
