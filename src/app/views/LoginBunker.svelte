<script lang="ts">
  import {Nip46Broker} from "@welshman/signer"
  import {isKeyValid} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithNip46} from "src/engine"
  import {boot} from "src/app/state"

  let input = ""
  let loading = false

  const back = () => history.back()

  const logIn = async () => {
    loading = true

    try {
      const {pubkey, token, relays} = await Nip46Broker.parseBunkerLink(input)

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

<FlexColumn class="max-w-md text-center">
  <Heading>Login with Signer</Heading>
  <p>To log in using a signer app, enter a connection link starting with "bunker://".</p>
  <Input bind:value={input} placeholder="bunker://..." disabled={loading}>
    <i slot="before" class="fa fa-box" />
  </Input>
  <div class="flex gap-2">
    <Anchor button on:click={back} disabled={loading}><i class="fa fa-arrow-left" /> Back</Anchor>
    <Anchor button accent class="flex-grow" {loading} on:click={logIn}>Continue</Anchor>
  </div>
</FlexColumn>
