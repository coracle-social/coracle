<script lang="ts">
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

<h1>Disconnect Wallet</h1>
<p>Are you sure you want to disconnect your bitcoin wallet?</p>
<p></p>
<div class="flex justify-between">
  <Button class="btn" on:click={back}>Go Back</Button>
  <Button class="btn btn-accent" on:click={confirm}>Confirm</Button>
</div>
