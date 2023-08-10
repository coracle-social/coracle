<script lang="ts">
  import PersonBadge from "src/app/shared/PersonBadge.svelte"

  export let label
  export let pubkeys
</script>

<p class="text-xl">{label}</p>
<div class="flex flex-col gap-4">
  {#each pubkeys as pubkey}
    <PersonBadge {pubkey} />
  {/each}
</div>
