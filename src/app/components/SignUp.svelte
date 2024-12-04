<script lang="ts">
  import {postJson, assoc} from "@welshman/lib"
  import {makeSecret, Nip46Broker} from "@welshman/signer"
  import {pubkey, loadHandle, updateSession} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import SignUpSuccess from "@app/components/SignUpSuccess.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {BURROW_URL, PLATFORM_NAME, NIP46_PERMS} from "@app/state"
  import {pushToast} from "@app/toast"
  import {loginWithNip46} from "@app/commands"

  const relays = ["wss://relay.nsec.app"]

  const signerDomain = "nsec.app"

  const signerPubkey = "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb"

  const login = () => pushModal(LogIn)

  const withLoading =
    (cb: (...args: any[]) => any) =>
    async (...args: any[]) => {
      loading = true

      try {
        await cb(...args)
      } finally {
        loading = false
      }
    }

  const signupPassword = withLoading(async () => {
    const res = await postJson(BURROW_URL + "/user", {email, password})

    if (res.error) {
      return pushToast({message: res.error, theme: "error"})
    }

    pushModal(SignUpSuccess, {email}, {replaceState: true})
  })

  const signupNsecApp = withLoading(async () => {
    const handle = await loadHandle(`${username}@${signerDomain}`)

    if (handle?.pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that account already exists. Try logging in instead.",
      })
    }

    const clientSecret = makeSecret()
    const broker = Nip46Broker.get({
      relays,
      clientSecret,
      signerPubkey,
      algorithm: "nip04",
    })

    const userPubkey = await broker.createAccount(username, signerDomain, NIP46_PERMS)

    if (!userPubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like something went wrong. Please try again.",
      })
    }

    // Now we can log in. Use the user's pubkey for the handler (legacy stuff)
    const success = await loginWithNip46({relays, signerPubkey: userPubkey, clientSecret})

    if (!success) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like something went wrong. Please try again.",
      })
    }

    updateSession($pubkey!, assoc("email", email))
    pushToast({message: "Successfully logged in!"})
    setChecked("*")
    clearModals()
  })

  const signup = () => {
    if (BURROW_URL) {
      signupPassword()
    } else {
      signupNsecApp()
    }
  }

  let email = ""
  let password = ""
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
  {#if BURROW_URL}
    <FieldInline>
      <p slot="label">Email</p>
      <label class="input input-bordered flex w-full items-center gap-2" slot="input">
        <Icon icon="user-rounded" />
        <input bind:value={email} />
      </label>
    </FieldInline>
    <FieldInline>
      <p slot="label">Password</p>
      <label class="input input-bordered flex w-full items-center gap-2" slot="input">
        <Icon icon="key" />
        <input bind:value={password} type="password" />
      </label>
    </FieldInline>
    <Button type="submit" class="btn btn-primary" disabled={loading || !email || !password}>
      <Spinner {loading}>Sign Up</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
    <p class="text-sm opacity-75">
      Note that your email and password will only work to log in to {PLATFORM_NAME}. To use your key
      on other nostr applications, you can create a nostr key yourself, or export your key from {PLATFORM_NAME}
      later.
    </p>
  {:else}
    <Field>
      <div class="flex items-center gap-2" slot="input">
        <label class="input input-bordered flex w-full items-center gap-2">
          <Icon icon="user-rounded" />
          <input bind:value={username} class="grow" type="text" placeholder="username" />
        </label>
        @{signerDomain}
      </div>
    </Field>
    <Button type="submit" class="btn btn-primary" disabled={loading || !username}>
      <Spinner {loading}>Sign Up</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  {/if}
  <Divider>Or</Divider>
  <Link
    external
    href="https://nosta.me"
    class="btn {username || email || password ? 'btn-neutral' : 'btn-primary'}">
    <Icon icon="square-share-line" />
    Get started on Nosta.me
  </Link>
  <div class="text-sm">
    Already have an account?
    <Button class="link" on:click={login}>Log in instead</Button>
  </div>
</form>
