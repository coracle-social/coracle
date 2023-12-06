<script lang="ts">
  import {toHex} from "src/util/nostr"
  import {toast} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {isKeyValid, loginWithNsecBunker} from "src/engine"
  import {boot} from "src/app/state"
    import { nip05 } from "nostr-tools"

  let input = ""

  const parse = async () => {
    const r = {pubkey: "", relay: "", token: ""}

    if (input.startsWith("bunker://")) {
      try {
        const url = new URL(input)

        r.pubkey = url.pathname.slice(2)
        r.relay = url.searchParams.get("relay") || ""
      } catch {
        // pass
      }
    } else if (input.match(/@/)) {
      /**
       * Check if this is looks like a nip05 profile.
       */
      const profile = await nip05.queryProfile(input);
      if (profile) {
        r.pubkey = profile.pubkey;
      } else {
        toast.show("error", "Sorry, but that's an invalid public key.")
      }
    } else {
      const [npub, token] = input.split("#")
      r.pubkey = npub.startsWith("npub") ? toHex(npub) : npub
      r.token = token
    }

    return r
  }

  const logIn = async () => {
    const params = await parse()
    if (isKeyValid(params.pubkey)) {
      loginWithNsecBunker(params.pubkey, params.token, params.relay)
      boot()
    } else {
        toast.show("error", "Sorry, but that's an invalid public key.")
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
      <Input bind:value={input} placeholder="npub... or bunker://...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor button on:click={logIn}>Log In</Anchor>
  </div>
</Content>
