<script lang="ts">
  import {Capacitor} from "@capacitor/core"
  import {isKeyValid, toHex} from "src/util/nostr"
  import {appName} from "src/partials/state"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {loginWithPrivateKey} from "src/engine"
  import {boot} from "src/app/state"
  import Modal from "src/partials/Modal.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Field from "src/partials/Field.svelte"
  import {decrypt} from "nostr-tools/nip49"
  import {bytesToHex} from "@noble/hashes/utils"

  let value = ""
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  let willShowPasswordModal = false

  const showPasswordModal = () => {
    willShowPasswordModal = true
  }

  const closePasswordModal = () => {
    willShowPasswordModal = false
  }

  const logIn = (privkey: string) => {
    if (isKeyValid(privkey)) {
      loginWithPrivateKey(privkey)
      boot()
    } else {
      showWarning("Sorry, but that's an invalid private key.")
    }
  }

  const onSubmit = () => {
    if (value.startsWith("ncryptsec")) {
      return showPasswordModal()
    }

    const privkey = value.startsWith("nsec") ? toHex(value) : value

    logIn(privkey)
  }

  const onPasswordModalSubmit = () => {
    try {
      const privkey = bytesToHex(decrypt(value, password))

      closePasswordModal()
      logIn(privkey)
    } catch {
      showWarning("Password is invalid!")
    }
  }

  $: password = ""
</script>

<Content size="lg" class="text-center">
  <Heading>Login with your Private Key</Heading>
  <p>To give {appName} full access to your nostr identity, enter your private key below.</p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input type="password" bind:value placeholder="nsec... or ncryptsec..." class="rounded-full">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor circle button accent tall class="cy-login-submit" on:click={onSubmit}>
      <i class="fa fa-right-to-bracket" />
    </Anchor>
  </div>
  {#if !Capacitor.isNativePlatform()}
    <p class="rounded border-2 border-solid border-warning bg-neutral-800 px-6 py-3">
      Note that sharing your private key directly is not recommended, instead you should use a <Anchor
        href={nip07}
        external>compatible browser extension</Anchor> to securely store your key.
    </p>
  {/if}
</Content>

{#if willShowPasswordModal}
  <Modal onEscape={closePasswordModal}>
    <FlexColumn>
      <p>
        Enter password to decrypt your <strong>ncryptsec</strong>.
      </p>
      <Field label="Password">
        <Input type="password" bind:value={password} />
      </Field>
      <div class="flex justify-center gap-2">
        <Anchor button on:click={closePasswordModal}>Cancel</Anchor>
        <Anchor button accent on:click={onPasswordModalSubmit}>Log In</Anchor>
      </div>
    </FlexColumn>
  </Modal>
{/if}
