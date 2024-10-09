<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
</script>

<div class="btn btn-neutral btn-lg h-24 text-left w-full">
  <div class="flex gap-6 flex-row justify-between items-center w-full {$$props.class}">
    <div class="flex gap-6 items-center">
      <div class="w-12 center">
        <slot name="icon" />
      </div>
      <div class="flex flex-grow flex-col gap-1">
        <p class="text-bold"><slot name="title" /></p>
        <p class="text-xs"><slot name="info" /></p>
      </div>
    </div>
    <div class="w-12 center">
      <Icon size={7} icon="alt-arrow-right" />
    </div>
  </div>
</div>
