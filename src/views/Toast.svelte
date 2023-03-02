<script lang="ts">
  import cx from 'classnames'
  import {is} from 'ramda'
  import {fly} from 'svelte/transition'
  import {toast} from "src/app/ui"
</script>

{#if $toast}
{#key 'key'}
<div
  class="fixed top-0 left-0 right-0 z-30 pointer-events-none flex justify-center"
  transition:fly={{y: -50, duration: 300}}>
  <div
    class={cx(
      "rounded shadow-xl m-2 ml-16 sm:ml-2 p-3 text-center border pointer-events-auto",
      "max-w-xl flex-grow transition-all",
      {
        'bg-dark border-medium text-white': $toast.type === 'info',
        'bg-dark border-warning text-white': $toast.type === 'warning',
        'bg-dark border-danger text-white': $toast.type === 'error',
      }
     )}>
    {#if is(String, $toast.message)}
    {$toast.message}
    {:else}
    <div>
      {$toast.message.text}
      {#if $toast.message.link}
      <a class="ml-1 underline" href={$toast.message.link.href}>
        {$toast.message.link.text}
      </a>
      {/if}
    </div>
    {/if}
  </div>
</div>
{/key}
{/if}
