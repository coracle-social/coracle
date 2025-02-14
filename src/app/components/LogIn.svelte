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
  import LogInPassword from "@app/components/LogInPassword.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {PLATFORM_NAME, BURROW_URL} from "@app/state"
  import {pushToast} from "@app/toast"
  import {loadUserData} from "@app/requests"
  import {setChecked} from "@app/notifications"

  let signers: any[] = $state([])
  let loading: string | undefined = $state()

  const disabled = $derived(loading ? true : undefined)

  const signUp = () => pushModal(SignUp)

  const onSuccess = async (session: Session, relays: string[] = []) => {
    await loadUserData(session.pubkey, {relays})

    addSession(session)
    pushToast({message: "Successfully logged in!"})
    setChecked("*")
    clearModals()
  }

  const loginWithNip07 = async () => {
    loading = "nip07"

    try {
      const pubkey = await getNip07()?.getPublicKey()

      if (pubkey) {
        await onSuccess({method: "nip07", pubkey})
      } else {
        pushToast({
          theme: "error",
          message: "Something went wrong! Please try again.",
        })
      }
    } finally {
      loading = undefined
    }
  }

  const loginWithNip55 = async (app: any) => {
    loading = "nip55"

    try {
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
    } finally {
      loading = undefined
    }
  }

  const loginWithPassword = () => pushModal(LogInPassword)

  const loginWithBunker = () => pushModal(LogInBunker)

  const hasSigner = $derived(getNip07() || signers.length > 0)

  onMount(async () => {
    if (Capacitor.isNativePlatform()) {
      signers = await getNip55()
    }
  })
</script>

<div class="column gap-4">
  <h1 class="heading">Log in with Nostr</h1>
  <p class="m-auto max-w-sm text-center">
    {PLATFORM_NAME} is built using the
    <Button class="link" onclick={() => pushModal(InfoNostr)}>nostr protocol</Button>, which allows
    you to own your social identity.
  </p>
  {#if getNip07()}
    <Button {disabled} onclick={loginWithNip07} class="btn btn-primary">
      {#if loading === "nip07"}
        <span class="loading loading-spinner mr-3"></span>
      {:else}
        <Icon icon="widget" />
      {/if}
      Log in with Extension
    </Button>
  {/if}
  {#each signers as app}
    <Button {disabled} class="btn btn-primary" onclick={() => loginWithNip55(app)}>
      {#if loading === "nip55"}
        <span class="loading loading-spinner mr-3"></span>
      {:else}
        <img src={app.iconUrl} alt={app.name} width="20" height="20" />
      {/if}
      Log in with {app.name}
    </Button>
  {/each}
  {#if BURROW_URL && !hasSigner}
    <Button {disabled} onclick={loginWithPassword} class="btn btn-primary">
      {#if loading === "password"}
        <span class="loading loading-spinner mr-3"></span>
      {:else}
        <Icon icon="key" />
      {/if}
      Log in with Password
    </Button>
  {/if}
  <Button
    onclick={loginWithBunker}
    {disabled}
    class="btn {hasSigner || BURROW_URL ? 'btn-neutral' : 'btn-primary'}">
    <Icon icon="cpu" />
    Log in with Remote Signer
  </Button>
  {#if BURROW_URL && hasSigner}
    <Button {disabled} onclick={loginWithPassword} class="btn">
      {#if loading === "password"}
        <span class="loading loading-spinner mr-3"></span>
      {:else}
        <Icon icon="key" />
      {/if}
      Log in with Password
    </Button>
  {/if}
  {#if !hasSigner || !BURROW_URL}
    <Link
      external
      {disabled}
      href="https://nostrapps.com#signers"
      class="btn {hasSigner || BURROW_URL ? '' : 'btn-neutral'}">
      <Icon icon="compass" />
      Browse Signer Apps
    </Link>
  {/if}
  <div class="text-sm">
    Need an account?
    <Button class="link" onclick={signUp}>Register instead</Button>
  </div>
</div>
