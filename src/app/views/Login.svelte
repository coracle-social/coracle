<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {last, prop, objOf} from "ramda"
  import {Capacitor} from "@capacitor/core"
  import {HANDLER_INFORMATION, NOSTR_CONNECT} from "@welshman/util"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {loadHandle} from "@welshman/app"
  import {parseJson} from "src/util/misc"
  import {appName} from "src/partials/state.ts"
  import {showWarning} from "src/partials/Toast.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {load, loginWithExtension, loginWithNostrConnect, loginWithSigner} from "src/engine"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"

  const signUp = () => router.at("signup").replaceModal()

  const useBunker = () => router.at("login/bunker").replaceModal()

  const useExtension = async () => {
    const signer = new Nip07Signer()
    const pubkey = await signer.getPubkey()

    loginWithExtension(pubkey)
    boot()
  }

  // Define the interface for AppInfo
  interface AppInfo {
    name: string
    packageName: string
    iconData: string
    iconUrl: string // the url to the App's icon
  }

  let signerApps: AppInfo[] = []

  const useSigner = async (app: AppInfo) => {
    const signer = new Nip55Signer(app.packageName)
    const pubkey = await signer.getPubkey()
    loginWithSigner(pubkey, app.packageName)
    boot()
  }

  const usePrivateKey = () => router.at("login/privkey").replaceModal()

  const usePublicKey = () => router.at("login/pubkey").replaceModal()

  const onSubmit = async () => {
    if (!username) {
      return showWarning("Please enter a user name.")
    }

    if (!handler) {
      return showWarning("Please select a login provider.")
    }

    loading = true

    try {
      // Fill in pubkey and relays if they entered a custom doain
      if (!handler.pubkey) {
        const handle = await loadHandle(`_@${handler.domain}`)

        handler.pubkey = handle?.pubkey
        handler.relays = handle?.nip46 || handle?.relays || []
      }

      if (!handler.relays) {
        return showWarning("Sorry, we weren't able to find that provider.")
      }

      const success = await loginWithNostrConnect(username, handler)

      if (success) {
        boot()
      } else {
        showWarning("Sorry, we weren't able to log you in with that provider.")
      }
    } finally {
      loading = false
    }
  }

  let handlers = [
    //  {
    //    domain: "coracle-bunker.ngrok.io",
    //    relays: ["wss://relay.nsecbunker.com", "wss://relay.damus.io"],
    //    pubkey: "b6e0188cf22c58a96b5cf6f29014f140697196f149a2621536b12d50abf55aa0",
    //  },
    {
      domain: "nsec.app",
      relays: ["wss://relay.nsec.app"],
      pubkey: "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb",
    },
    {
      domain: "highlighter.com",
      relays: ["wss://relay.nsecbunker.com", "wss://relay.damus.io"],
      pubkey: "73c6bb92440a9344279f7a36aa3de1710c9198b1e9e8a394cd13e0dd5c994c63",
    },
  ]

  let loading
  let handler = handlers[0]
  let username = ""

  onMount(async () => {
    load({
      filters: [
        {
          kinds: [HANDLER_INFORMATION],
          "#k": [NOSTR_CONNECT.toString()],
        },
      ],
      onEvent: async e => {
        const content = parseJson(e.content)

        if (!content) {
          return
        }

        const domain = last(content.nip05.split("@"))
        const handle = await loadHandle(`_@${domain}`)
        const relays = handle?.nip46 || handle?.relays || []

        if (handlers.some(h => h.domain === domain)) {
          return
        }

        if (handle?.pubkey === e.pubkey) {
          handlers = handlers.concat({pubkey: e.pubkey, domain, relays})
        }
      },
    })

    if (Capacitor.isNativePlatform()) {
      signerApps = await getNip55()
    }
  })

  document.title = "Log In"
</script>

<form on:submit={onSubmit}>
  <FlexColumn narrow large>
    <div class="text-center">
      <Heading>Welcome!</Heading>
      <p class="text-lg text-neutral-100">
        {appName} is built using the
        <Anchor external underline href="https://nostr.com/">nostr protocol</Anchor>, which allows
        you to own your social identity.
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <Field label="Username">
        <Input bind:value={username} placeholder="Username">
          <i slot="before" class="fa fa-user-astronaut" />
        </Input>
      </Field>
      <Field label="Remote Signer">
        <SearchSelect
          bind:value={handler}
          defaultOptions={handlers}
          getKey={prop("domain")}
          termToItem={objOf("domain")}
          search={() => handlers}>
          <i slot="before" class="fa fa-at relative top-[2px]" />
          <span slot="item" let:item>{item.domain}</span>
        </SearchSelect>
      </Field>
      <Anchor button accent tall disabled={!username} {loading} on:click={onSubmit}>Log In</Anchor>
    </div>
    <div class="relative flex items-center gap-4">
      <div class="h-px flex-grow bg-neutral-600" />
      <div class="staatliches text-xl">Or</div>
      <div class="h-px flex-grow bg-neutral-600" />
    </div>
    <div
      class="relative flex flex-col gap-4">
      {#if getNip07()}
        <Anchor button tall accent={!username} low={username} class="cursor-pointer" on:click={useExtension}>
          <i class="fa fa-puzzle-piece" /> Browser Extension
        </Anchor>
      {/if}
      {#each signerApps as app}
        <Anchor button tall accent class="cursor-pointer" on:click={() => useSigner(app)}>
          <img src={app.iconUrl} alt={app.name} width="20" height="20" />
          {app.name}
        </Anchor>
      {/each}
      <Anchor button low tall class="cursor-pointer" on:click={useBunker}>
        <i class="fa fa-box" /> Bunker URL
      </Anchor>
      <Anchor button low tall class="cursor-pointer" on:click={usePrivateKey}>
        <i class="fa fa-key" /> Private Key
      </Anchor>
      <Anchor button low tall class="cursor-pointer" on:click={usePublicKey}>
        <i class="fa fa-eye" /> Public Key
      </Anchor>
    </div>
    <span>
      Need an account?
      <Anchor underline on:click={signUp}>Register instead</Anchor>
    </span>
  </FlexColumn>
</form>
