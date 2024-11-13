<script lang="ts">
  import {onMount} from "svelte"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithNip07, loginWithNip55} from "src/engine"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"

  // Define the interface for AppInfo
  interface AppInfo {
    name: string
    packageName: string
    iconData: string
    iconUrl: string // the url to the App's icon
  }

  const signUp = () => router.at("signup").replaceModal()

  const useBunker = () => router.at("login/bunker").pushModal()

  const useExtension = async () => {
    const signer = new Nip07Signer()
    const pubkey = await signer.getPubkey()

    loginWithNip07(pubkey)
    boot()
  }

  const useSigner = async (app: AppInfo) => {
    const signer = new Nip55Signer(app.packageName)
    const pubkey = await signer.getPubkey()

    loginWithNip55(pubkey, app.packageName)
    boot()
  }

  let signerApps: AppInfo[] = []

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
        <Anchor external underline href="https://nostr.com/">nostr protocol</Anchor>, which allows
        you to own your social identity.
      </p>
    </div>
    <div class="relative flex flex-col gap-4">
      {#if getNip07()}
        <Anchor button tall accent on:click={useExtension}>
          <i class="fa fa-puzzle-piece" /> Use Browser Extension
        </Anchor>
      {/if}
      {#each signerApps as app}
        <Anchor button tall on:click={() => useSigner(app)}>
          <img src={app.iconUrl} alt={app.name} width="20" height="20" />
          Use {app.name}
        </Anchor>
      {/each}
      <Anchor button tall on:click={useBunker}>
        <i class="fa fa-box" /> Use Remote Signer
      </Anchor>
      <Anchor external button tall low href="https://nostrapps.com/#signers">
        <i class="fa fa-compass" /> Browse Signer Apps
      </Anchor>
    </div>
    <span class="text-center">
      Need an account?
      <Anchor underline on:click={signUp}>Register instead</Anchor>
    </span>
  </FlexColumn>
</div>
