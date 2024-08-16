<script lang="ts">
  import {makeSecret, Nip46Broker} from "@welshman/signer"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import InfoNostr from "@app/components/LogIn.svelte"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {addSession, nip46Perms} from "@app/base"
  import {loadHandle} from "@app/state"

  const login = () => pushModal(LogIn)

  const trySignup = async () => {
    const secret = makeSecret()
    const handle = await loadHandle(`${username}@${handler.domain}`)

    if (handle?.pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that account already exists. Try logging in instead.",
      })
    }

    const signupBroker = Nip46Broker.get("", secret, handler)
    const pubkey = await signupBroker.createAccount(username, nip46Perms)

    if (!pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like something went wrong. Please try again.",
      })
    }

    const loginBroker = Nip46Broker.get(pubkey, secret, handler)

    if (await loginBroker.connect("", nip46Perms)) {
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

  const signup = async () => {
    loading = true

    try {
      await trySignup()
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

<form class="column gap-4" on:submit|preventDefault={signup}>
  <h1 class="heading">Sign up with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    Flotilla is built using the
    <Button class="link" on:click={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
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
    <Button type="submit" class="btn btn-primary" disabled={!username || loading}>
      <Spinner {loading}>Sign Up</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
    <div class="text-sm">
      Already have an account?
      <Button class="link" on:click={login}>Log in instead</Button>
    </div>
  </div>
</form>
