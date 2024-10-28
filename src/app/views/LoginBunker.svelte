<script lang="ts">
  import {nip19} from "nostr-tools"
  import {isKeyValid, toHex} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithBunker} from "src/engine"
  import {boot} from "src/app/state"
  import {nip05} from "nostr-tools"

  let input = ""

  const parse = async uri => {
    const r = {pubkey: "", relay: "", token: ""}

    try {
      const url = new URL(uri)

      r.pubkey = url.hostname
      r.relays = url.searchParams.getAll("relay") || []
      r.token = url.searchParams.get("secret") || ""
    } catch {
      // pass
    }

    return r
  }

  const logIn = async () => {
    const {pubkey, token, relays} = await parse(input)

    if (!isKeyValid(pubkey)) {
      return showWarning("Sorry, but that's an invalid public key.")
    }

    if (relays.length === 0) {
      return showWarning("That connection string doesn't have any relays.")
    }

    const success = await loginWithBunker(pubkey, token, relays)

    if (success) {
      boot()
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with Bunker</Heading>
  <p>To log in remotely, enter your connection string below.</p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={input} placeholder="bunker://...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor button accent on:click={logIn}>
      <i class="fa fa-right-to-bracket" />
    </Anchor>
  </div>
</Content>
