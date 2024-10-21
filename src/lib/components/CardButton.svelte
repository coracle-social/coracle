<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
</script>

<div class="btn btn-neutral h-[unset] flex flex-nowrap w-full text-left py-4 {$$props.class}">
  <div class="flex flex-row items-start gap-1 flex-grow">
    <div class="w-12 h-14 flex items-center flex-shrink-0">
      <slot name="icon" />
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg text-bold pt-2">
        <slot name="title" />
      </p>
      <p class="text-sm">
        <slot name="info" />
      </p>
    </div>
  </div>
  <div class="w-14 h-14 flex items-center justify-end">
    <Icon size={7} icon="alt-arrow-right" />
  </div>
</div>
