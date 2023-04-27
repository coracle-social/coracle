<script lang="ts">
  import cx from "classnames"
  import {is} from "ramda"
  import {fly} from "svelte/transition"
  import {toast} from "src/partials/state"
</script>

{#if $toast}
  {#key "key"}
    <div
      class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex justify-center"
      transition:fly={{y: -50, duration: 300}}>
      <div
        class={cx(
          "pointer-events-auto m-2 ml-16 rounded border p-3 text-center shadow-xl sm:ml-2",
          "max-w-xl flex-grow transition-all",
          {
            "border-gray-6 bg-gray-7 text-gray-2": $toast.type === "info",
            "border-warning bg-gray-7 text-gray-2": $toast.type === "warning",
            "border-danger bg-gray-7 text-gray-2": $toast.type === "error",
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
