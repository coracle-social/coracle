<script lang="ts">
  import {toHex} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {toast} from "src/partials/state"
  import {isKeyValid, loginWithPublicKey} from "src/engine"
  import {boot} from "src/app/state"

  let npub = ""

  const logIn = () => {
    const pubkey = npub.startsWith("npub") ? toHex(npub) : npub

    if (isKeyValid(pubkey)) {
      loginWithPublicKey(pubkey)
      boot()
    } else {
      toast.show("error", "Sorry, but that's an invalid public key.")
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with your Public Key</Heading>
  <p>
    For read-only access, enter your public key (or someone else's) below. Your key should start
    with "npub".
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={npub} placeholder="npub...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor theme="button" on:click={logIn}>Log In</Anchor>
  </div>
</Content>
