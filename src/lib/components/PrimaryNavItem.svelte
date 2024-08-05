<script lang="ts">
  export let title
</script>

<div class="relative z-nav-item flex justify-center items-center w-14 h-14">
  <div class="avatar rounded-full p-1 bg-base-300 cursor-pointer tooltip tooltip-right" data-tip={title}>
    <slot />
  </div>
</div>
