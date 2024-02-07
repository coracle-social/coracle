<script lang="ts">
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
    getHandle,
    getUserHints,
    getExtension,
    withExtension,
    loginWithExtension,
    loginWithNostrConnect,
  } from "src/engine"
  import {router} from "src/app/router"
  import {boot} from "src/app/state"

  const useExtension = () =>
    withExtension(async ext => {
      const pubkey = ext && (await ext.getPublicKey())

      if (pubkey) {
        loginWithExtension(pubkey)
        boot()
      }
    })

  const useBunker = async () => {
    if (!username) {
      return toast.show("error", "Please enter a user name.")
    }

    if (!handler) {
      return toast.show("error", "Please select a login provider.")
    }

    // Fill in pubkey and relays if they entered a custom doain
    if (!handler.pubkey) {
      const {pubkey, nip46} = await getHandle(`_@${handler.domain}`)

      handler.pubkey = pubkey
      handler.relays = nip46
    }

    if (!handler.relays) {
      return toast.show("error", "Sorry, we weren't able to find that provider.")
    }

    loginWithNostrConnect(username, handler)
  }

  const signUp = () => router.at("onboarding").replaceModal()

  const useKeys = () => router.at("login/direct").replaceModal()

  let handlers = [
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

        if (!content || handlers.find(h => h.pubkey === e.pubkey)) {
          return
        }

        const domain = last(content.nip05.split("@"))
        const {pubkey, nip46: relays} = await getHandle(`_@${domain}`)

        if (pubkey === e.pubkey) {
          handlers = handlers.concat({pubkey, domain, relays})
        }
      },
    })
  })

  document.title = "Log In"
</script>

<FlexColumn narrow large>
  <div class="text-center">
    <Heading>Welcome!</Heading>
    <p class="text-lg text-lightest">
      Don't have an account yet?
      <Anchor underline on:click={signUp} class="ml-1 text-white">Sign up</Anchor>
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
  <Anchor button accent on:click={useBunker}>Log In</Anchor>
  <div class="relative flex items-center gap-4">
    <div class="h-px flex-grow bg-mid" />
    <div class="staatliches text-xl">Or</div>
    <div class="h-px flex-grow bg-mid" />
  </div>
  <div class="relative flex justify-center gap-4">
    {#if getExtension()}
      <Anchor button on:click={useExtension}>
        <i class="fa fa-puzzle-piece" />
        Extension
      </Anchor>
    {/if}
    <Anchor button on:click={useKeys}>
      <i class="fa fa-key" />
      Keys
    </Anchor>
  </div>
</FlexColumn>
