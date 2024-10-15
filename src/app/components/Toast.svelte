<script lang="ts">
  import {fly} from "@lib/transition"
  import {toast} from "@app/toast"
</script>

{#if $toast}
  {@const theme = $toast.theme || "info"}
  <div transition:fly class="toast z-toast">
    {#key $toast.id}
      <div
        role="alert"
        class="alert flex justify-center"
        class:bg-base-100={theme === "info"}
        class:text-base-content={theme === "info"}
        class:alert-error={theme === "error"}>
        {$toast.message}
      </div>
    {/key}
  </div>
{/if}
