<script lang="ts">
  import {nip19} from "nostr-tools"
  import {makeSecret, Nip46Broker} from "@welshman/signer"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import InfoNostr from "@app/components/LogIn.svelte"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {addSession} from "@app/base"
  import {loadHandle} from "@app/state"

  const back = () => history.back()

  const tryLogin = async () => {
    const secret = makeSecret()
    const handle = await loadHandle(`${username}@${handler.domain}`)
    console.log(handle)

    if (!handle?.pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like you don't have an account yet. Try signing up instead.",
      })
    }

    const {pubkey, relays = []} = handle
    const broker = Nip46Broker.get(pubkey, secret, handler)

    if (await broker.connect()) {
      addSession({method: "nip46", pubkey, secret, handler})
      pushToast({message: "Successfully logged in!"})
      clearModal()
    } else {
      pushToast({
        theme: "error",
        message: "Something went wrong! Please try again.",
      })
    }
  }

  const login = async () => {
    loading = true

    try {
      await tryLogin()
    } finally {
      loading = false
    }
  }

  const handler = {
    domain: "nsec.app",
    relays: ["wss://relay.nsec.app"],
    pubkey: "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb",
  }

  let username = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={login}>
  <div class="py-2">
    <h1 class="heading">Log in with Nostr</h1>
    <p class="text-center">
      Flotilla is built using the
      <Button class="link" on:click={() => pushModal(InfoNostr)}>nostr protocol</Button>, which
      allows you to own your social identity.
    </p>
  </div>
  <Field>
    <div class="flex items-center gap-2" slot="input">
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="user-rounded" />
        <input bind:value={username} class="grow" type="text" placeholder="username" />
      </label>
      @{handler.domain}
    </div>
  </Field>
  <div class="flex flex-col gap-2">
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Log In</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
    <div class="text-sm">
      Need an account?
      <Button class="link" on:click={back}>Register</Button>
    </div>
  </div>
</form>
