<script lang="ts">
  import {page} from "$app/stores"

  export let href

  $: active = $page.route.id?.startsWith(href)
</script>

<a
  {href}
  class="button group justify-start border-none transition-all hover:bg-base-100"
  class:text-stark-content={active}
  class:bg-base-100={active}>
  <div class="flex items-center gap-3">
    <slot />
  </div>
</a>
