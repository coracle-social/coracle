<script lang="ts">
  import {pubkey} from '@welshman/app'
  import Landing from "@app/components/Landing.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
</script>

<div class="flex h-screen overflow-hidden">
  <PrimaryNav>
    {#if $pubkey}
      <slot />
    {:else}
      <Landing />
    {/if}
  </PrimaryNav>
</div>
<Toast />
