<script lang="ts">
  import {onMount} from "svelte"
  import {last, prop, objOf} from "ramda"
  import {Capacitor} from "@capacitor/core"
  import {HANDLER_INFORMATION, NOSTR_CONNECT, normalizeRelayUrl} from "@welshman/util"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer, Nip46Broker} from "@welshman/signer"
  import {loadHandle, nip46Perms, addSession} from "@welshman/app"
  import {parseJson} from "src/util/misc"
  import {appName} from "src/partials/state"
  import {showWarning} from "src/partials/Toast.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {load, loginWithNip07, loginWithNip55} from "src/engine"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"

  // Define the interface for AppInfo
  interface AppInfo {
    name: string
    packageName: string
    iconData: string
    iconUrl: string // the url to the App's icon
  }

  const signUp = () => {
    router.at("signup").replaceModal()
  }

  const useBunker = () => router.at("login/bunker").replaceModal()

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

  const normalizeHandler = async () => {
    if (!handler.pubkey || !handler.relays) {
      const handle = await loadHandle(`_@${handler.domain}`)

      handler.pubkey = handler.pubkey || handle?.pubkey
      handler.relays = handler.relays || handle?.nip46 || handle?.relays
    }

    if (handler.relays) {
      handler.relays = handler.relays.map(normalizeRelayUrl)
    }
  }

  const onSubmit = async () => {
    abortController = new AbortController()

    try {
      await normalizeHandler()

      if (!handler.relays || !handler.pubkey) {
        return showWarning("Sorry, we weren't able to find that provider.")
      }

      const init = Nip46Broker.initiate({
        name: appName,
        perms: nip46Perms,
        relays: handler.relays,
        url: import.meta.env.VITE_APP_URL,
        image: import.meta.env.VITE_APP_URL + import.meta.env.VITE_APP_LOGO,
        abortController,
      })

      window.open(init.getLink("use.nsec.app"))

      const pubkey = await init.result

      if (!pubkey) {
        return showWarning("Sorry, we weren't able to connect you. Please try again.")
      }

      addSession({
        pubkey,
        method: "nip46",
        secret: init.clientSecret,
        // Goofy legacy stuff, someday this will be gone
        handler: {...handler, pubkey},
      })

      boot()
    } finally {
      abortController = undefined
    }
  }

  let signerApps: AppInfo[] = []
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

  let abortController: AbortController
  let handler = handlers[0]

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
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        <div class="flex-grow">
          <SearchSelect
            bind:value={handler}
            defaultOptions={handlers}
            getKey={prop("domain")}
            termToItem={objOf("domain")}
            search={() => handlers}>
            <i slot="before" class="fa fa-key" />
            <span slot="item" let:item>{item.domain}</span>
          </SearchSelect>
        </div>
        <Anchor button accent type="submit" loading={Boolean(abortController)} on:click={onSubmit}
          >Log In</Anchor>
      </div>
      <p class="text-sm opacity-75">
        Choose a signer who you trust to hold your keys.
        <Anchor underline modal href="/help/remote-signers">What is a signer?</Anchor>
      </p>
    </div>
    <div class="relative flex items-center gap-4">
      <div class="h-px flex-grow bg-neutral-600" />
      <div class="staatliches text-xl">Or</div>
      <div class="h-px flex-grow bg-neutral-600" />
    </div>
    <div
      class="relative flex flex-col gap-4"
      class:opacity-75={abortController}
      class:cursor-events-none={abortController}>
      {#if getNip07()}
        <Anchor button tall accent class="cursor-pointer" on:click={useExtension}>
          <i class="fa fa-puzzle-piece" /> Use Browser Extension
        </Anchor>
      {/if}
      {#each signerApps as app}
        <Anchor button tall class="cursor-pointer" on:click={() => useSigner(app)}>
          <img src={app.iconUrl} alt={app.name} width="20" height="20" />
          Use {app.name}
        </Anchor>
      {/each}
      <Anchor button tall class="cursor-pointer" on:click={useBunker}>
        <i class="fa fa-box" /> Use Self-Hosted Signer
      </Anchor>
    </div>
    <span class="text-center">
      Need an account?
      <Anchor underline on:click={signUp}>Register instead</Anchor>
    </span>
  </FlexColumn>
</div>
