<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Landing from "@app/components/Landing.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
</script>

<div class="flex h-screen overflow-hidden">
  {#if $pubkey}
    <PrimaryNav>
      <slot />
    </PrimaryNav>
  {:else}
    <Landing />
  {/if}
</div>
<Toast />
