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
  import {fade} from "@lib/transition"
  import {page} from "$app/stores"

  export let href: string = ""
  export let notification = false

  $: active = $page.url.pathname === href
</script>

{#if href}
  <a
    {...$$props}
    {href}
    on:click
    class={cx(
      $$props.class,
      "relative flex items-center gap-3 text-left transition-all hover:bg-base-100 hover:text-base-content",
    )}
    class:text-base-content={active}
    class:bg-base-100={active}>
    <slot />
    {#if !active && notification}
      <div class="absolute right-2 top-5 h-2 w-2 rounded-full bg-primary" transition:fade></div>
    {/if}
  </a>
{:else}
  <button
    {...$$props}
    on:click
    class={cx(
      $$props.class,
      "relative flex w-full items-center gap-3 text-left transition-all hover:bg-base-100 hover:text-base-content",
    )}
    class:text-base-content={active}
    class:bg-base-100={active}>
    {#if !active && notification}
      <div class="absolute right-2 top-5 h-2 w-2 rounded-full bg-primary" transition:fade></div>
    {/if}
    <slot />
  </button>
{/if}
