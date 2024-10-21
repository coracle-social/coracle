<div class="flex items-center gap-2 p-2 text-xs uppercase opacity-50">
  <div class="h-px flex-grow bg-base-content opacity-25" />
  {#if $$slots.default}
    <p><slot /></p>
    <div class="h-px flex-grow bg-base-content opacity-25" />
  {/if}
</div>
