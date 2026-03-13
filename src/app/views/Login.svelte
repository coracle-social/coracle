<script lang="ts">
  import {_} from "svelte-i18n"
  import {onMount} from "svelte"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {loginWithNip55, loginWithNip07} from "@welshman/app"
  import {appName} from "src/partials/state"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"

  // Define the interface for AppInfo
  interface AppInfo {
    name: string
    packageName: string
    iconUrl?: string
  }

  const signUp = () => router.at("signup").replaceModal()

  const useBunker = () => router.at("login/bunker").pushModal()

  const useExtension = async () => {
    const signer = new Nip07Signer()
    const pubkey = await signer.getPubkey()

    loginWithNip07(pubkey)
    boot()
  }

  console.log("=========== hi")
  const useSigner = async (app: AppInfo) => {
    console.log("=======", JSON.stringify(app))
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

  document.title = $_("login.title")
</script>

<div>
  <FlexColumn narrow large>
    <div class="text-center">
      <Heading>{$_("login.welcome")}</Heading>
      <p>
        {$_("login.builtWith", {values: {appName}})}
        <Link class="underline" external href="https://nostr.com/">{$_("login.nostrProtocol")}</Link
        >{$_("login.ownsIdentity")}
      </p>
    </div>
    <div class="relative flex flex-col gap-4">
      {#if getNip07()}
        <Button class="btn btn-tall btn-accent" on:click={useExtension}>
          <i class="fa fa-puzzle-piece" />
          {$_("login.useExtension")}
        </Button>
      {/if}
      {#each signerApps as app}
        <Button class="btn btn-tall" on:click={() => useSigner(app)}>
          <img src={app.iconUrl} alt={app.name} width="20" height="20" />
          {$_("login.use", {values: {name: app.name}})}
        </Button>
      {/each}
      <Button class="btn btn-tall" on:click={useBunker}>
        <i class="fa fa-box" />
        {$_("login.useRemoteSigner")}
      </Button>
      <Link external class="btn btn-tall btn-low" href="https://nostrapps.com/#signers">
        <i class="fa fa-compass" />
        {$_("login.browseSignerApps")}
      </Link>
    </div>
    <span class="text-center">
      {$_("login.needAccount")}
      <Button class="underline" on:click={signUp}>{$_("login.registerInstead")}</Button>
    </span>
  </FlexColumn>
</div>
