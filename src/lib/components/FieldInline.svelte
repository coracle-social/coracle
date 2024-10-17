<div class="grid grid-cols-3 gap-2 {$$props.class}">
  <label class="flex items-center gap-2 font-bold">
    <slot name="label" />
  </label>
  <div class="col-span-2">
    <slot name="input" />
  </div>
  {#if $$slots.info}
    <p class="text-sm col-start-2 col-span-2">
      <slot name="info" />
    </p>
  {/if}
</div>
