<script lang="ts">
  import {fly} from "@lib/transition"
  import {toast} from "@app/toast"
</script>

{#if $toast}
  {@const theme = $toast.theme || "info"}
  {#key $toast.id}
    <div transition:fly class="toast z-toast">
      <div
        role="alert"
        class="alert flex justify-center"
        class:alert-info={theme === "info"}
        class:alert-error={theme === "error"}>
        {$toast.message}
      </div>
    </div>
  {/key}
{/if}
