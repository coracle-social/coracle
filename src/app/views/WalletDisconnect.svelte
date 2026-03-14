<script lang="ts">
  import {_} from "svelte-i18n"
  import {assoc} from "@welshman/lib"
  import {pubkey, updateSession} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util"

  const back = () => router.back()

  const confirm = async () => {
    updateSession($pubkey, assoc("wallet", undefined))
    router.clearModals()
  }
</script>

<h1>{$_("walletDisconnect.title")}</h1>
<p>{$_("walletDisconnect.confirm")}</p>
<p></p>
<div class="flex justify-between">
  <Button class="btn" on:click={back}>{$_("walletDisconnect.goBack")}</Button>
  <Button class="btn btn-accent" on:click={confirm}>{$_("walletDisconnect.confirmButton")}</Button>
</div>
