<script lang="ts">
  import {makeSecret, Nip46Broker} from "@welshman/signer"
  import {addSession, loadHandle} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {PLATFORM_NAME, NIP46_PERMS} from "@app/state"
  import {pushToast} from "@app/toast"

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

    const signupBroker = Nip46Broker.get({secret, handler})
    const pubkey = await signupBroker.createAccount(username, NIP46_PERMS)

    if (!pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like something went wrong. Please try again.",
      })
    }

    // Gotta use user pubkey as the handler pubkey for historical reasons
    const loginBroker = Nip46Broker.get({secret, handler: {...handler, pubkey}})

    if (await loginBroker.connect("", NIP46_PERMS)) {
      addSession({method: "nip46", pubkey, secret, handler: {...handler, pubkey}})
      pushToast({message: "Successfully logged in!"})
      setChecked("*")
      clearModals()
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
    {PLATFORM_NAME} is built using the
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
  <Button type="submit" class="btn btn-primary" disabled={!username || loading}>
    <Spinner {loading}>Sign Up</Spinner>
    <Icon icon="alt-arrow-right" />
  </Button>
  <Divider>Or</Divider>
  <Link external href="https://nosta.me" class="btn {username ? 'btn-neutral' : 'btn-primary'}">
    <Icon icon="square-share-line" />
    Get started on Nosta.me
  </Link>
  <div class="text-sm">
    Already have an account?
    <Button class="link" on:click={login}>Log in instead</Button>
  </div>
</form>
