<div class="flex flex-col gap-2">
  <label class="flex items-center gap-2 font-bold">
    <slot name="label" />
  </label>
  <slot name="input" />
  <p class="text-sm">
    <slot name="info" />
  </p>
</div>
