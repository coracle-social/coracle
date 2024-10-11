<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
</script>

<div class="btn btn-neutral btn-lg h-24 w-full text-left">
  <div class="flex w-full flex-row items-center justify-between gap-2 {$$props.class}">
    <div class="flex items-center gap-6">
      <div class="center w-12">
        <slot name="icon" />
      </div>
      <div class="flex flex-grow flex-col gap-2">
        <p class="text-bold"><slot name="title" /></p>
        <p class="text-xs"><slot name="info" /></p>
      </div>
    </div>
    <div class="center w-12">
      <Icon size={7} icon="alt-arrow-right" />
    </div>
  </div>
</div>
