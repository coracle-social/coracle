<script lang="ts">
  import {toHex} from "src/util/nostr"
  import {toast} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {isKeyValid, loginWithNsecBunker} from "src/engine"
  import {boot} from "src/app/state"

  let input = ""

  const logIn = () => {
    const [npub, token] = input.split("#")
    const pubkey = npub.startsWith("npub") ? toHex(npub) : npub

    if (isKeyValid(pubkey)) {
      loginWithNsecBunker(pubkey, token)
      boot()
    } else {
      toast.show("error", "Sorry, but that's an invalid public key.")
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with NsecBunker</Heading>
  <p>
    To log in remotely, enter your nsec bunker token or pubkey below. If you're not using a token,
    you'll need to approve authorization requests in your bunker's admin interface.
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={input} placeholder="npub...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor theme="button" on:click={logIn}>Log In</Anchor>
  </div>
</Content>
