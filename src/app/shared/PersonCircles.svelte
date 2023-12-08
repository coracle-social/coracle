<script lang="ts">
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let pubkeys

  const klass = $$props.class || "w-8 h-8"
</script>

<div class="flex">
  {#each pubkeys as pubkey (pubkey)}
    <div class="z-feature -mr-3 inline-block">
      <PersonCircle class={klass} {pubkey} />
    </div>
  {/each}
</div>
