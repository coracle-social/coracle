<script lang="ts">
  import {WRAP} from "@welshman/util"
  import {repository} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import {canDecrypt, loadMessages, ensureUnwrapped, env} from "src/engine"
  import {router} from "src/app/util"

  let loading = false

  const enableChat = async () => {
    canDecrypt.set(true)

    for (const event of repository.query([{kinds: [WRAP]}])) {
      ensureUnwrapped(event)
    }

    loadMessages()
  }

  const submit = () => {
    loading = true

    enableChat()
    loading = false
    router.pop()
  }

  const back = () => {
    router.back(1)
  }
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
  <h1 class="text-2xl font-bold">Do you want to enable notes and direct messages?</h1>
  <br />
  <p>
    By default, notes and direct messages are disabled, since loading them requires
    {env.CLIENT_NAME} to download and decrypt a lot of data.
  </p>
  <br />
  <p>
    If you'd like to enable them, please make sure your signer is set up to to auto-approve requests
    to decrypt data.
  </p>
  <br />
  <div class="flex justify-between">
    <Anchor button tag="a" on:click={back}>
      <span class="fa fa-arrow-left" />
      Go back
    </Anchor>
    <Anchor button accent type="submit" tag="button" disabled={loading}>
      Enable Messages
      <span class="fa fa-arrow-right" />
    </Anchor>
  </div>
</form>
