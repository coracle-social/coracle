<script lang="ts">
  import {_} from "svelte-i18n"
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
  <h1 class="text-2xl font-bold">{$_("chatEnable.enableQuestion")}</h1>
  <br />
  <p>
    {$_("chatEnable.disabledByDefault", {values: {appName: env.CLIENT_NAME}})}
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
      {$_("chatEnable.goBack")}
    </Button>
    <Button class="btn btn-accent" type="submit">
      {$_("chatEnable.enableMessages")}
      <span class="fa fa-arrow-right" />
    </Button>
  </div>
</form>
