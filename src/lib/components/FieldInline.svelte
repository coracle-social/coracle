<div class="flex flex-col gap-2 {$$props.class}">
  <div class="grid grid-cols-3">
    <label class="flex items-center gap-2 font-bold">
      <slot name="label" />
    </label>
    <div class="col-span-2">
      <slot name="input" />
    </div>
  </div>
  {#if $$slots.info}
    <p class="text-sm">
      <slot name="info" />
    </p>
  {/if}
</div>
