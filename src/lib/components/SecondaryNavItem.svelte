<script lang="ts">
  export let href
  export let active
</script>

<a {href} class="button group hover:bg-base-100 transition-all justify-start border-none">
  <div class="flex items-center gap-3 group-hover:brightness=[1.5]" class:group-hover:brightness-[1.4]={active}>
    <slot />
  </div>
</a>
