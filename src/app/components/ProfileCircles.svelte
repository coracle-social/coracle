<script lang="ts">
  import ProfileCircle from "@app/components/ProfileCircle.svelte"

  export let pubkeys
</script>

<div class="flex pr-3">
  {#each pubkeys.slice(0, 15) as pubkey (pubkey)}
    <div class="z-feature -mr-3 inline-block">
      <ProfileCircle class="h-8 w-8 bg-base-300" {pubkey} {...$$props} />
    </div>
  {/each}
</div>
