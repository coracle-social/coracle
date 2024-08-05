<script lang="ts">
  export let title
</script>

<div class="relative z-nav-item flex h-14 w-14 items-center justify-center">
  <div
    class="avatar tooltip tooltip-right cursor-pointer rounded-full bg-base-300 p-1"
    data-tip={title}>
    <slot />
  </div>
</div>
