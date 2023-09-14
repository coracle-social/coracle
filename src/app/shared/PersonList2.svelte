<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"

  export let pubkeys
</script>

<Content gap="gap-2">
  {#each pubkeys as pubkey (pubkey)}
    <PersonSummary {pubkey} />
  {/each}
</Content>
