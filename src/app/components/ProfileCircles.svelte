<script lang="ts">
  import {deriveProfile} from '@welshman/app'
  import ProfileCircle from "@app/components/ProfileCircle.svelte"

  export let pubkeys
</script>

<div class="flex pr-3">
  {#each pubkeys.slice(0, 15) as pubkey (pubkey)}
    <div class="z-feature -mr-3 inline-block">
      <ProfileCircle class="w-8 h-8" {pubkey} {...$$props} />
    </div>
  {/each}
</div>
