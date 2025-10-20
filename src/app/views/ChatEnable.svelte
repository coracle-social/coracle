<script lang="ts">
  import {shouldUnwrap} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import {loadMessages, env} from "src/engine"
  import {router} from "src/app/util"

  const enableChat = async () => {
    shouldUnwrap.set(true)
    loadMessages()
  }

  const submit = () => {
    enableChat()
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
    <Button class="btn" on:click={back}>
      <span class="fa fa-arrow-left" />
      Go back
    </Button>
    <Button class="btn btn-accent" type="submit">
      Enable Messages
      <span class="fa fa-arrow-right" />
    </Button>
  </div>
</form>
