<script context="module" lang="ts">
  import {NostrSignerPlugin} from "nostr-signer-capacitor-plugin"
  import {setNip55Plugin} from "@welshman/signer"

  setNip55Plugin(NostrSignerPlugin)
</script>

<script lang="ts">
  import {onMount} from "svelte"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, getNip55, Nip55Signer} from "@welshman/signer"
  import type {Nip55AppInfo} from "@welshman/signer"
  import {toSession, nip07, nip55} from "@welshman/app"
  import type {Session} from "@welshman/app"
  import {appName} from "src/partials/state"
  import {showWarning} from "src/partials/Toast.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {login} from "src/engine/core"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"

  const signUp = () => router.at("signup").replaceModal()

  const useBunker = () => router.at("login/bunker").pushModal()

  const logIn = async (session: Session) => {
    try {
      await login(session)
    } catch (e) {
      console.error(e)

      return showWarning("We weren't able to log you in with that signer")
    }

    boot()
  }

  const useExtension = () => logIn(toSession(nip07, {}))

  const useSigner = async (signerApp: Nip55AppInfo) => {
    const signer = new Nip55Signer(signerApp.packageName)
    const pubkey = await signer.getPubkey()

    return logIn(toSession(nip55, {pubkey, signer: signerApp.packageName}))
  }

  let signerApps: Nip55AppInfo[] = []

  onMount(async () => {
    if (Capacitor.isNativePlatform()) {
      signerApps = await getNip55()
    }
  })

  document.title = "Log In"
</script>

<div>
  <FlexColumn narrow large>
    <div class="text-center">
      <Heading>Welcome!</Heading>
      <p>
        {appName} is built using the
        <Link class="underline" external href="https://nostr.com/">nostr protocol</Link>, which
        allows you to own your social identity.
      </p>
    </div>
    <div class="relative flex flex-col gap-4">
      {#if getNip07()}
        <Button class="btn btn-tall btn-accent" on:click={useExtension}>
          <i class="fa fa-puzzle-piece" /> Use Browser Extension
        </Button>
      {/if}
      {#each signerApps as signerApp}
        <Button class="btn btn-tall" on:click={() => useSigner(signerApp)}>
          <img src={signerApp.iconUrl} alt={signerApp.name} width="20" height="20" />
          Use {signerApp.name}
        </Button>
      {/each}
      <Button class="btn btn-tall" on:click={useBunker}>
        <i class="fa fa-box" /> Use Remote Signer
      </Button>
      <Link external class="btn btn-tall btn-low" href="https://nostrapps.com/#signers">
        <i class="fa fa-compass" /> Browse Signer Apps
      </Link>
    </div>
    <span class="text-center">
      Need an account?
      <Button class="underline" on:click={signUp}>Register instead</Button>
    </span>
  </FlexColumn>
</div>
