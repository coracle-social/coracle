<script lang="ts">
  import Profile from "@app/components/Profile.svelte"

  export let pubkeys
</script>

<div class="row-2">
  {#each pubkeys as pubkey (pubkey)}
    <Profile {pubkey} />
  {/each}
</div>
