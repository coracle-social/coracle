<script lang="ts">
  import PersonBadge from "src/app/shared/PersonBadge.svelte"

  export let pubkeys
</script>

<div class="flex flex-col gap-2">
  <slot />
  <div class="flex flex-col gap-2">
    {#each pubkeys as pubkey}
      <PersonBadge {pubkey} />
    {/each}
  </div>
</div>
