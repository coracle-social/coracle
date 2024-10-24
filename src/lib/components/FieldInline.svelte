<div class="grid grid-cols-2 gap-2 {$$props.class}">
  <label class="flex items-center gap-2 font-bold">
    <slot name="label" />
  </label>
  <div class="flex items-center gap-2">
    <slot name="input" />
  </div>
  {#if $$slots.info}
    <p class="col-span-2 text-sm flex-end">
      <slot name="info" />
    </p>
  {/if}
</div>
