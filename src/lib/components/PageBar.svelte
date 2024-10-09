<div class="relative z-feature mx-2 rounded-xl pt-4">
  <div
    class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
    <div class="flex items-center gap-4">
      <slot name="icon" />
      <slot name="title" />
    </div>
    <slot name="action" />
  </div>
</div>
