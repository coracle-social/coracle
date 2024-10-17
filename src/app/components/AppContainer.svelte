<script lang="ts">
  import {page} from "$app/stores"
  import {pubkey} from "@welshman/app"
  import Landing from "@app/components/Landing.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import {modals} from "@app/modal"
</script>

<div class="flex h-screen overflow-hidden">
  {#if $pubkey}
    <PrimaryNav>
      <slot />
    </PrimaryNav>
  {:else if !$modals[$page.url.hash.slice(1)]}
    <Landing />
  {/if}
</div>
<Toast />
