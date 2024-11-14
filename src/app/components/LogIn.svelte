<script lang="ts">
  import {onMount} from "svelte"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, getNip55, Nip55Signer} from "@welshman/signer"
  import {addSession, type Session} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import LogInBunker from "@app/components/LogInBunker.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {PLATFORM_NAME} from "@app/state"
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

  const loginWithBunker = () => pushModal(LogInBunker)

  let loading = false
  let signers: any[] = []
  let hasNativeSigner = Boolean(getNip07())

  onMount(async () => {
    if (Capacitor.isNativePlatform()) {
      signers = await getNip55()

      if (signers.length > 0) {
        hasNativeSigner = true
      }
    }
  })
</script>

<div class="column gap-4">
  <h1 class="heading">Log in with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    {PLATFORM_NAME} is built using the
    <Button class="link" on:click={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
  {#if getNip07()}
    <Button disabled={loading} on:click={loginWithNip07} class="btn btn-primary">
      {#if loading}
        <span class="loading loading-spinner mr-3" />
      {:else}
        <Icon icon="widget" />
      {/if}
      Log in with Extension
    </Button>
  {/if}
  {#each signers as app}
    <Button disabled={loading} class="btn btn-neutral" on:click={() => loginWithSigner(app)}>
      {#if loading}
        <span class="loading loading-spinner mr-3" />
      {:else}
        <img src={app.iconUrl} alt={app.name} width="48" height="48" />
      {/if}
      Log in with {app.name}
    </Button>
  {/each}
  <Button
    disabled={loading}
    on:click={loginWithBunker}
    class="btn {hasNativeSigner ? 'btn-neutral' : 'btn-primary'}">
    <Icon icon="cpu" />
    Log in with Remote Signer
  </Button>
  <Link
    external
    disabled={loading}
    href="https://nostrapps.com#signers"
    class="btn {hasNativeSigner ? '' : 'btn-neutral'}">
    <Icon icon="compass" />
    Browse Signer Apps
  </Link>
  <div class="text-sm">
    Need an account?
    <Button class="link" on:click={signUp}>Register instead</Button>
  </div>
</div>
