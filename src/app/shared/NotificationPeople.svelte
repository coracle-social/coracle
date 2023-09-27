<script lang="ts">
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"

  export let pubkeys
  export let actionText
</script>

{#if pubkeys.length === 1}
  <div class="flex items-center gap-2">
    <PersonCircle size={6} pubkey={pubkeys[0]} />
    <PersonName class="font-bold" pubkey={pubkeys[0]} />
    <span>{actionText}.</span>
  </div>
{:else}
  <div class="flex gap-6">
    <PersonCircles size={6} pubkeys={pubkeys.slice(0, 8)} />
    <span>{pubkeys.length} people {actionText}.</span>
  </div>
{/if}
