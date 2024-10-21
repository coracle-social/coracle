<script lang="ts">
  import {onMount} from "svelte"
  import {makeSecret, getNip07, Nip46Broker, getNip55, Nip55Signer} from "@welshman/signer"
  import {addSession, loadHandle, nip46Perms, type Session} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import LogInInfoRemoteSigner from "@app/components/LogInInfoRemoteSigner.svelte"
  import LogInKey from "@app/components/LogInKey.svelte"
  import {pushModal, clearModals} from "@app/modal"
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
    clearModals()
  }

  const loginWithNip46 = withLoading(async () => {
    const rootHandle = await loadHandle(`_@${domain}`)

    if (!rootHandle?.pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, we couldn't find that remote signer.",
      })
    }

    const secret = makeSecret()
    const {pubkey, nip46, relays = []} = (await loadHandle(`${username}@${domain}`)) || {}

    if (!pubkey) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like you don't have an account yet. Try signing up instead.",
      })
    }

    const handler = {
      domain,
      pubkey: rootHandle.pubkey,
      relays: rootHandle.nip46 || rootHandle.relays || nip46 || relays,
    }

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

  const loginWithSigner = async (app: any) => {
    const signer = new Nip55Signer(app.packageName)
    const pubkey = await signer.getPubkey()

    if (pubkey) {
      await onSuccess({method: "nip55", pubkey, signer: app.packageName})
    } else {
      pushToast({
        theme: "error",
        message: "Something went wrong! Please try again.",
      })
    }
  }

  const loginWithKey = () => pushModal(LogInKey)

  let username = ""
  let domain = "nsec.app"
  let loading = false
  let signers: any[] = []

  onMount(async () => {
    signers = await getNip55()
  })
</script>

<form class="column gap-4" on:submit|preventDefault={loginWithNip46}>
  <h1 class="heading">Log in with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    Flotilla is built using the
    <Button class="link" on:click={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
  <div class="grid grid-cols-3 items-center gap-3">
    <p class="font-bold">Username</p>
    <label class="input input-bordered col-span-2 flex w-full items-center gap-2">
      <Icon icon="user-circle" />
      <input
        bind:value={username}
        disabled={loading}
        class="grow"
        type="text"
        placeholder="username" />
    </label>
    <Tippy component={LogInInfoRemoteSigner} params={{interactive: true}}>
      <p class="flex cursor-pointer items-center gap-2 font-bold">
        Remote Signer
        <Icon icon="info-circle" class="opacity-50" />
      </p>
    </Tippy>
    <label class="input input-bordered col-span-2 flex w-full items-center gap-2">
      <Icon icon="key-minimalistic-square-3" />
      <input bind:value={domain} disabled={loading} class="grow" type="text" />
    </label>
  </div>
  <Button type="submit" class="btn btn-primary flex-grow" disabled={!username || loading}>
    <Spinner {loading}>Log In</Spinner>
    <Icon icon="alt-arrow-right" />
  </Button>
  <Divider>Or</Divider>
  {#if getNip07()}
    <Button
      disabled={loading}
      on:click={loginWithNip07}
      class="btn {username ? 'btn-neutral' : 'btn-primary'}">
      <Icon icon="widget" />
      Log in with Extension
    </Button>
  {/if}
  {#each signers as app}
    <Button disabled={loading} class="btn btn-neutral" on:click={() => loginWithSigner(app)}>
      <img src={app.iconUrl} alt={app.name} width="48" height="48" />
      Log in with {app.name}
    </Button>
  {/each}
  <Button disabled={loading} on:click={loginWithKey} class="btn btn-neutral">
    <Icon icon="key" />
    Log in with Key
  </Button>
  <div class="text-sm">
    Need an account?
    <Button class="link" on:click={signUp}>Register instead</Button>
  </div>
</form>
