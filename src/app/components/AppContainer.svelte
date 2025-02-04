<script lang="ts">
  import type {Snippet} from "svelte"
  import {page} from "$app/stores"
  import {pubkey} from "@welshman/app"
  import Landing from "@app/components/Landing.svelte"
  import Toast from "@app/components/Toast.svelte"
  import PrimaryNav from "@app/components/PrimaryNav.svelte"
  import EmailConfirm from "@app/components/EmailConfirm.svelte"
  import PasswordReset from "@app/components/PasswordReset.svelte"
  import {BURROW_URL} from "@app/state"
  import {modals, pushModal} from "@app/modal"

  interface Props {
    children: Snippet
  }

  const {children}: Props = $props()

  if (BURROW_URL && !$pubkey) {
    if ($page.url.pathname === "/confirm-email") {
      pushModal(EmailConfirm, {
        email: $page.url.searchParams.get("email"),
        confirm_token: $page.url.searchParams.get("confirm_token"),
      })
    }

    if ($page.url.pathname === "/reset-password") {
      pushModal(PasswordReset, {
        email: $page.url.searchParams.get("email"),
        reset_token: $page.url.searchParams.get("reset_token"),
      })
    }
  }
</script>

<div class="flex h-screen overflow-hidden">
  {#if $pubkey}
    <PrimaryNav>
      {@render children?.()}
    </PrimaryNav>
  {:else if !$modals[$page.url.hash.slice(1)]}
    <Landing />
  {/if}
</div>
<Toast />
