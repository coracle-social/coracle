<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
</script>

<div class="btn btn-neutral flex h-[unset] w-full flex-nowrap py-4 text-left {$$props.class}">
  <div class="flex flex-grow flex-row items-start gap-1 pl-2">
    <div class="flex h-14 w-12 flex-shrink-0 items-center">
      <slot name="icon" />
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-bold pt-2 text-lg">
        <slot name="title" />
      </p>
      <p class="text-sm">
        <slot name="info" />
      </p>
    </div>
  </div>
  <div class="flex h-14 w-14 items-center justify-end">
    <Icon size={7} icon="alt-arrow-right" />
  </div>
</div>
