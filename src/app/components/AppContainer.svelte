<script lang="ts">
  import {page} from "$app/stores"
  import {pubkey} from "@welshman/app"
  import Landing from "@app/components/Landing.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import SignUpConfirm from "@app/components/SignUpConfirm.svelte"
  import {BURROW_URL} from "@app/state"
  import {modals, pushModal} from "@app/modal"

  if (BURROW_URL && $page.route.id === "/confirm-email") {
    pushModal(SignUpConfirm, {
      email: $page.url.searchParams.get("email"),
      token: $page.url.searchParams.get("token"),
    })
  }
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
