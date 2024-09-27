<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {last, prop, objOf} from "ramda"
  import {HANDLER_INFORMATION, NOSTR_CONNECT} from "@welshman/util"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {loadHandle} from "@welshman/app"
  import {parseJson} from "src/util/misc"
  import {showWarning} from "src/partials/Toast.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Tile from "src/partials/Tile.svelte"
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
    name: string;
    packageName: string;
    icon: string; // Base64-encoded string of the app icon
  }

  let signerApps:AppInfo[] = []

  const useSigner = async (app:AppInfo) => {
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
    signerApps = await getNip55()
  })

  document.title = "Log In"
</script>

<form on:submit={onSubmit}>
  <FlexColumn narrow large>
    <div class="text-center">
      <Heading>Welcome!</Heading>
      <p class="text-lg text-neutral-100">
        Don't have an account yet?
        <Anchor underline on:click={signUp} class="ml-1 text-neutral-100">Sign up</Anchor>
      </p>
    </div>
    <div class="flex">
      <Input bind:value={username} class="flex-grow rounded-r-none" placeholder="Username">
        <i slot="before" class="fa fa-user-astronaut" />
      </Input>
      <SearchSelect
        bind:value={handler}
        defaultOptions={handlers}
        getKey={prop("domain")}
        termToItem={objOf("domain")}
        inputClass="rounded-l-none border-l-0 flex-grow"
        search={() => handlers}>
        <i slot="before" class="fa fa-at relative top-[2px]" />
        <span slot="item" let:item>{item.domain}</span>
      </SearchSelect>
    </div>
    <Anchor button accent {loading} on:click={onSubmit}>Log In</Anchor>
    <div class="relative flex items-center gap-4">
      <div class="h-px flex-grow bg-neutral-600" />
      <div class="staatliches text-xl">Or</div>
      <div class="h-px flex-grow bg-neutral-600" />
    </div>
    <div
      class={cx(
        "relative grid justify-center gap-2 xs:gap-5",
        getNip07() || signerApps.length > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
      )}>
      <Tile class="cursor-pointer bg-tinted-800" on:click={useBunker}>
        <div>
          <i class="fa fa-box fa-xl" />
        </div>
        <span>Bunker URL</span>
      </Tile>
      {#if getNip07()}
        <Tile class="cursor-pointer bg-tinted-800" on:click={useExtension}>
          <div>
            <i class="fa fa-puzzle-piece fa-xl" />
          </div>
          <span>Extension</span>
        </Tile>
      {/if}
      <Tile class="cursor-pointer bg-tinted-800" on:click={usePrivateKey}>
        <div>
          <i class="fa fa-key fa-xl" />
        </div>
        <span>Private Key</span>
      </Tile>
      <Tile class="cursor-pointer bg-tinted-800" on:click={usePublicKey}>
        <div>
          <i class="fa fa-eye fa-xl" />
        </div>
        <span>Public Key</span>
      </Tile>
      {#if signerApps.length > 0}
        {#each signerApps as app}
          <Tile class="cursor-pointer bg-tinted-800" on:click={() => useSigner(app)}>
            <div>
				<img
                src={`data:image/png;base64,${app.icon}`}
                alt={app.name}
                width="48"
                height="48"
              />
            </div>
            <span>{app.name}</span>
          </Tile>
        {/each}
      {/if}
    </div>
  </FlexColumn>
</form>
