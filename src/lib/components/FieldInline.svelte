<div class="grid grid-cols-1 gap-2 md:grid-cols-3 {$$props.class}">
  <label class="flex items-center gap-2 font-bold">
    <slot name="label" />
  </label>
  <div class="col-span-2 flex items-center gap-2">
    <slot name="input" />
  </div>
  <p class="flex-end text-sm md:col-span-3">
    {#if $$slots.info}
      <slot name="info" />
    {/if}
  </p>
</div>
