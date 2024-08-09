<script lang="ts">
  import {fly} from "@lib/transition"
  import {toast} from "@app/toast"
</script>

{#if $toast}
  {#key $toast.id}
    <div transition:fly class="toast z-toast">
      <div role="alert" class="alert flex justify-center" class:alert-error={$toast.theme === "error"}>
        {$toast.message}
      </div>
    </div>
  {/key}
{/if}
