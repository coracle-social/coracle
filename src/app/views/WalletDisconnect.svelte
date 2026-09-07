<script lang="ts">
  import type {Wallet} from "@welshman/util"
  import Button from "src/partials/Button.svelte"
  import {pubkey, sessions} from "src/engine/core"
  import type {StoredSession} from "src/engine/core"
  import {router} from "src/app/util"

  // Wallet configuration is coracle's own per-account metadata, so it rides alongside welshman's
  // serializable session in the sessions store rather than inside it.
  type SessionWithWallet = StoredSession & {wallet?: Wallet}

  const back = () => router.back()

  const confirm = async () => {
    const userPubkey = pubkey.get()

    if (userPubkey) {
      sessions.update($sessions => {
        const stored: SessionWithWallet = $sessions[userPubkey]

        if (!stored) return $sessions

        const updated: SessionWithWallet = {...stored, wallet: undefined}

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
