<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import {pubkey, sessions} from "src/engine/core"
  import type {SessionWithMeta} from "src/engine"
  import {router} from "src/app/util"

  const back = () => router.back()

  const confirm = async () => {
    const userPubkey = pubkey.get()

    if (userPubkey) {
      sessions.update($sessions => {
        const stored: SessionWithMeta = $sessions[userPubkey]

        if (!stored) return $sessions

        const updated: SessionWithMeta = {...stored, wallet: undefined}

        return {...$sessions, [userPubkey]: updated}
      })
    }

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
