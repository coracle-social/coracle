<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 {$$props.class}">
  <label class="flex items-center gap-2 font-bold">
    <slot name="label" />
  </label>
  <div class="flex items-center gap-2">
    <slot name="input" />
  </div>
  {#if $$slots.info}
    <p class="flex-end col-span-2 text-sm">
      <slot name="info" />
    </p>
  {/if}
</div>
