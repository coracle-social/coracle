<script lang="ts">
  import {nip19} from "nostr-tools"
  import {isKeyValid, toHex} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithNsecBunker} from "src/engine"
  import {boot} from "src/app/state"
  import {nip05} from "nostr-tools"

  let input = ""

  const parse = async uri => {
    const r = {pubkey: "", relay: "", token: ""}

    if (uri.match(/^bunker:\/\/npub1\w+@[\w\.]+$/)) {
      const [npub, relay] = uri.slice(9).split("@")
      const {data: pubkey} = nip19.decode(npub)

      uri = `bunker://${pubkey}?relay=wss://${relay}`
    }

    if (uri.startsWith("bunker://")) {
      try {
        const url = new URL(uri)

        r.pubkey = url.hostname || url.pathname.slice(2)
        r.relay = url.searchParams.get("relay") || ""
        r.token = url.searchParams.get("secret") || ""
      } catch {
        // pass
      }
    } else if (uri.match(/@/)) {
      /**
       * Check if this is looks like a nip05 profile.
       */
      const profile = await nip05.queryProfile(input)
      if (profile) {
        r.pubkey = profile.pubkey
      } else {
        showWarning("Sorry, it looks like that's an invalid public key.")
      }
    } else {
      const [npub, token] = input.split("#")
      r.pubkey = npub.startsWith("npub") ? toHex(npub) : npub
      r.token = token
    }

    return r
  }

  const logIn = async () => {
    const {pubkey, token, relay} = await parse(input)

    if (!isKeyValid(pubkey)) {
      return showWarning("Sorry, but that's an invalid public key.")
    }

    const success = await loginWithNsecBunker(pubkey, token, relay)

    if (success) {
      boot()
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with NsecBunker</Heading>
  <p>
    To log in remotely, enter your nsec bunker token, pubkey or bunker:// string below. If you're
    not using a token, you'll need to approve authorization requests in your bunker's admin
    interface.
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={input} placeholder="npub... or bunker://..." class="rounded-full">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor circle button tall accent on:click={logIn}>
      <i class="fa fa-right-to-bracket" />
    </Anchor>
  </div>
</Content>
