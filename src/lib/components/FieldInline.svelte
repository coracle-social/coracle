<div class="flex flex-col gap-2 {$$props.class}">
  <div class="flex justify-between">
    <label class="flex items-center gap-2 font-bold">
      <slot name="label" />
    </label>
    <slot name="input" />
  </div>
  {#if $$slots.info}
    <p class="text-sm">
      <slot name="info" />
    </p>
  {/if}
</div>
