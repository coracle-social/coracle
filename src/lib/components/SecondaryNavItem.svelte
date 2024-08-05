<script lang="ts">
  export let href
  export let active
</script>

<a {href} class="button group justify-start border-none transition-all hover:bg-base-100">
  <div
    class="group-hover:brightness=[1.5] flex items-center gap-3"
    class:group-hover:brightness-[1.4]={active}>
    <slot />
  </div>
</a>
