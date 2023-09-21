<script lang="ts">
  import {Capacitor} from "@capacitor/core"
  import {toHex} from "src/util/nostr"
  import {toast, appName} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {isKeyValid, loginWithPrivateKey} from "src/engine"
  import {boot} from "src/app/state"

  let nsec = ""
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const logIn = () => {
    const privkey = nsec.startsWith("nsec") ? toHex(nsec) : nsec

    if (isKeyValid(privkey)) {
      loginWithPrivateKey(privkey)
      boot()
    } else {
      toast.show("error", "Sorry, but that's an invalid private key.")
    }
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Login with your Private Key</Heading>
  <p>To give {appName} full access to your nostr identity, enter your private key below.</p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input type="password" bind:value={nsec} placeholder="nsec...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor theme="button" on:click={logIn}>Log In</Anchor>
  </div>
  {#if !Capacitor.isNativePlatform()}
    <p class="rounded border-2 border-solid border-warning bg-gray-8 px-6 py-3">
      Note that sharing your private key directly is not recommended, instead you should use a <Anchor
        href={nip07}
        external>compatible browser extension</Anchor> to securely store your key.
    </p>
  {/if}
</Content>
