<script lang="ts">
  import {isKeyValid} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithNip46} from "src/engine"
  import {boot} from "src/app/state"

  let input = ""
  let loading = false

  const parse = async (uri: string) => {
    const r = {pubkey: "", relays: [], token: ""}

    try {
      const url = new URL(uri)

      r.pubkey = url.hostname || url.pathname.replace(/\//g, "")
      r.relays = url.searchParams.getAll("relay") || []
      r.token = url.searchParams.get("secret") || ""
    } catch {
      // pass
    }

    return r
  }

  const logIn = async () => {
    loading = true

    try {
      const {pubkey, token, relays} = await parse(input)

      if (!isKeyValid(pubkey)) {
        return showWarning("Sorry, but that's an invalid public key.")
      }

      if (relays.length === 0) {
        return showWarning("That connection string doesn't have any relays.")
      }

      const success = await loginWithNip46(token, {pubkey, relays})

      if (success) {
        boot()
      }
    } finally {
      loading = false
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with Signer</Heading>
  <p>To log in using a signer app, enter your connection string.</p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={input} placeholder="bunker://..." disabled={loading}>
        <i slot="before" class="fa fa-box" />
      </Input>
    </div>
    <Anchor button accent on:click={logIn} {loading}>
      <i class="fa fa-right-to-bracket" />
    </Anchor>
  </div>
</Content>
