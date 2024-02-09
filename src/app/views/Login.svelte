<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {last, prop, objOf} from "ramda"
  import {Handlerinformation, NostrConnect} from "nostr-tools/kinds"
  import {tryJson} from "src/util/misc"
  import {toast} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {
    load,
    fetchHandle,
    getUserHints,
    getExtension,
    withExtension,
    loginWithExtension,
    loginWithNostrConnect,
  } from "src/engine"
  import {router} from "src/app/router"
  import {boot} from "src/app/state"

  const signUp = () => router.at("onboarding").replaceModal()

  const useBunker = () => router.at("login/bunker").replaceModal()

  const useExtension = () =>
    withExtension(async ext => {
      const pubkey = ext && (await ext.getPublicKey())

      if (pubkey) {
        loginWithExtension(pubkey)
        boot()
      }
    })

  const usePrivateKey = () => router.at("login/privkey").replaceModal()

  const usePublicKey = () => router.at("login/pubkey").replaceModal()

  const onSubmit = async () => {
    if (!username) {
      return toast.show("error", "Please enter a user name.")
    }

    if (!handler) {
      return toast.show("error", "Please select a login provider.")
    }

    // Fill in pubkey and relays if they entered a custom doain
    if (!handler.pubkey) {
      const info = await fetchHandle(`_@${handler.domain}`)

      handler.pubkey = info.pubkey
      handler.relays = info.nip46 || info.relays
    }

    if (!handler.relays) {
      return toast.show("error", "Sorry, we weren't able to find that provider.")
    }

    const success = await loginWithNostrConnect(username, handler)

    if (success) {
      boot()
    }
  }

  let handlers = [
    //  {
    //    domain: "coracle-bunker.ngrok.io",
    //    relays: ["wss://relay.nsecbunker.com", "wss://relay.damus.io"],
    //    pubkey: "b6e0188cf22c58a96b5cf6f29014f140697196f149a2621536b12d50abf55aa0",
    //  },
    {
      domain: "highlighter.com",
      relays: ["wss://relay.nsecbunker.com", "wss://relay.damus.io"],
      pubkey: "73c6bb92440a9344279f7a36aa3de1710c9198b1e9e8a394cd13e0dd5c994c63",
    },
  ]

  let handler = handlers[0]
  let username = ""

  onMount(() => {
    load({
      relays: getUserHints(),
      filters: [
        {
          kinds: [Handlerinformation],
          "#k": [NostrConnect.toString()],
        },
      ],
      onEvent: async e => {
        const content = tryJson(() => JSON.parse(e.content))

        if (!content) {
          return
        }

        const domain = last(content.nip05.split("@"))
        const {pubkey, nip46: relays} = await fetchHandle(`_@${domain}`)

        if (handlers.some(h => h.domain === domain)) {
          return
        }

        if (pubkey === e.pubkey) {
          handlers = handlers.concat({pubkey, domain, relays})
        }
      },
    })
  })

  document.title = "Log In"
</script>

<form on:submit={onSubmit}>
  <FlexColumn narrow large>
    <div class="text-center">
      <Heading>Welcome!</Heading>
      <p class="text-lg text-lightest">
        Don't have an account yet?
        <Anchor underline on:click={signUp} class="ml-1 text-lightest">Sign up</Anchor>
      </p>
    </div>
    <div class="flex">
      <Input
        bind:value={username}
        class="rounded-r-none"
        wrapperClass="flex-grow"
        placeholder="Username">
        <i slot="before" class="fa fa-user-astronaut" />
      </Input>
      <SearchSelect
        bind:value={handler}
        defaultOptions={handlers}
        getKey={prop("domain")}
        termToItem={objOf("domain")}
        inputClass="rounded-l-none border-l-0"
        inputWrapperClass="flex-grow"
        search={() => handlers}>
        <i slot="before" class="fa fa-at relative top-[2px]" />
        <span slot="item" let:item>{item.domain}</span>
      </SearchSelect>
    </div>
    <Anchor button accent on:click={onSubmit}>Log In</Anchor>
    <div class="relative flex items-center gap-4">
      <div class="h-px flex-grow bg-mid" />
      <div class="staatliches text-xl">Or</div>
      <div class="h-px flex-grow bg-mid" />
    </div>
    <div
      class={cx(
        "relative grid justify-center gap-2 xs:gap-5",
        getExtension() ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
      )}>
      <Anchor button square low on:click={useBunker} class="flex-col justify-center gap-3">
        <div>
          <i class="fa fa-box fa-xl" />
        </div>
        <span>Bunker URL</span>
      </Anchor>
      {#if getExtension()}
        <Anchor button square low on:click={useExtension} class="flex-col justify-center gap-3">
          <div>
            <i class="fa fa-puzzle-piece fa-xl" />
          </div>
          <span>Extension</span>
        </Anchor>
      {/if}
      <Anchor button square low on:click={usePrivateKey} class="flex-col justify-center gap-3">
        <div>
          <i class="fa fa-key fa-xl" />
        </div>
        <span>Private Key</span>
      </Anchor>
      <Anchor button square low on:click={usePublicKey} class="flex-col justify-center gap-3">
        <div>
          <i class="fa fa-eye fa-xl" />
        </div>
        <span>Public Key</span>
      </Anchor>
    </div>
  </FlexColumn>
</form>
