<style>
  a,
  button {
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
  a:active:focus,
  button:active:hover,
  button:active:focus {
    animation: button-pop 0s ease-out;
    transform: scale(var(--btn-focus-scale, 0.97));
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {page} from "$app/stores"

  export let href: string = ""

  $: active = $page.url.pathname === href
</script>

{#if href}
  <a
    {...$$props}
    {href}
    on:click
    class={cx(
      $$props.class,
      "flex items-center gap-3 text-left transition-all hover:bg-base-100 hover:text-base-content",
    )}
    class:text-base-content={active}
    class:bg-base-100={active}>
    <slot />
  </a>
{:else}
  <button
    {...$$props}
    on:click
    class={cx(
      $$props.class,
      "flex w-full items-center gap-3 text-left transition-all hover:bg-base-100 hover:text-base-content",
    )}
    class:text-base-content={active}
    class:bg-base-100={active}>
    <slot />
  </button>
{/if}
