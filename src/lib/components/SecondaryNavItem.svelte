<script lang="ts">
  import {page} from "$app/stores"

  export let href

  $: active = $page.route.id?.startsWith(href)
</script>

<a
  {href}
  class="group justify-start border-none transition-all hover:bg-base-100"
  class:text-stark-content={active}
  class:bg-base-100={active}>
  <div class="flex items-center gap-3">
    <slot />
  </div>
</a>

<style>
a {
  padding: 12px 16px;
  display: flex;
  border-radius: var(--rounded-btn, 0.5rem);
  cursor: pointer;
  animation: nav-button-pop 200ms ease-out;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

a:active:hover,
a:active:focus {
  animation: button-pop 0s ease-out;
  transform: scale(var(--btn-focus-scale, 0.97));
}
</style>
