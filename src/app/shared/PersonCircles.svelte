<script lang="ts">
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let pubkeys
  export let size = 8
</script>

<div class="flex">
  {#each pubkeys as pubkey (pubkey)}
    <div class="z-10 -mr-3 inline-block">
      <PersonCircle {size} class="h-8 w-8" {pubkey} />
    </div>
  {/each}
</div>
