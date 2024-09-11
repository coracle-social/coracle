<script lang="ts">
  import {makeSecret, getNip07, Nip46Broker} from "@welshman/signer"
  import {addSession, loadHandle, nip46Perms, type Session} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import InfoNostr from "@app/components/LogIn.svelte"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {loadUserData} from "@app/commands"

  const signUp = () => pushModal(SignUp)

  const withLoading = (cb: () => void) => async () => {
    loading = true

    try {
      await cb()
    } finally {
      loading = false
    }
  }

  const onSuccess = async (session: Session, relays: string[] = []) => {
    addSession(session)

    await loadUserData(session.pubkey, {relays})

    pushToast({message: "Successfully logged in!"})
    clearModal()
  }

  const loginWithNip46 = withLoading(async () => {
    const secret = makeSecret()
    const handle = await loadHandle(`${username}@${handler.domain}`)

    if (!handle?.pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like you don't have an account yet. Try signing up instead.",
      })
    }

    const {pubkey, relays = []} = handle
    const broker = Nip46Broker.get(pubkey, secret, handler)

    if (await broker.connect("", nip46Perms)) {
      await onSuccess({method: "nip46", pubkey, secret, handler}, relays)
    } else {
      pushToast({
        theme: "error",
        message: "Something went wrong! Please try again.",
      })
    }
  })

  const loginWithNip07 = withLoading(async () => {
    const pubkey = await getNip07()?.getPublicKey()

    if (pubkey) {
      await onSuccess({method: "nip07", pubkey})
    } else {
      pushToast({
        theme: "error",
        message: "Something went wrong! Please try again.",
      })
    }
  })

  const handler = {
    domain: "nsec.app",
    relays: ["wss://relay.nsec.app"],
    pubkey: "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb",
  }

  let username = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={loginWithNip46}>
  <h1 class="heading">Log in with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    Flotilla is built using the
    <Button class="link" on:click={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
  <Field>
    <div class="flex items-center gap-2" slot="input">
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="user-rounded" />
        <input
          bind:value={username}
          disabled={loading}
          class="grow"
          type="text"
          placeholder="username" />
        <span>@{handler.domain}</span>
      </label>
      {#if getNip07()}
        <Button
          disabled={loading}
          on:click={loginWithNip07}
          class="btn btn-neutral tooltip tooltip-left"
          data-tip="Log in with browser extension">
          <Icon icon="square-share-line" />
        </Button>
      {/if}
    </div>
  </Field>
  <div class="flex flex-col gap-2">
    <Button type="submit" class="btn btn-primary flex-grow" disabled={!username || loading}>
      <Spinner {loading}>Log In</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
    <div class="text-sm">
      Need an account?
      <Button class="link" on:click={signUp}>Register instead</Button>
    </div>
  </div>
</form>
