<script lang="ts">
  import {encrypt} from "nostr-tools/nip49"
  import {hexToBytes} from "@noble/hashes/utils"
  import {makeSecret} from "@welshman/signer"
  import {preventDefault, downloadText} from "@lib/html"
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import SignUpKeyConfirm from "@app/components/SignUpKeyConfirm.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"

  const secret = makeSecret()

  const back = () => history.back()

  const next = () => {
    if (password.length < 12) {
      return pushToast({
        theme: "error",
        message: "Passwords must be at least 12 characters long.",
      })
    }

    const ncryptsec = encrypt(hexToBytes(secret), password)

    downloadText("Nostr Secret Key.txt", ncryptsec)

    pushModal(SignUpKeyConfirm, {secret, ncryptsec})
  }

  let password = ""
</script>

<form class="column gap-4" onsubmit={preventDefault(next)}>
  <ModalHeader>
    {#snippet title()}
      <div>Welcome to Nostr!</div>
    {/snippet}
  </ModalHeader>
  <p>
    <Link external href="https://nostr.com/" class="link">Nostr</Link> is way to build social apps that
    talk to each other. Users own their social identity instead of renting it from a tech company, and
    can take it with them.
  </p>
  <p>
    This means that instead of using a password to log in, you generate a <strong
      >secret key</strong>
    which gives you full control over your account.
  </p>
  <p>
    Keeping this key safe is very important, so we encourage you to download an encrypted copy. To
    do this, go ahead and fill in the password you'd like to use to secure your key below.
  </p>
  <Field>
    {#snippet label()}
      Password*
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="key" />
        <input bind:value={password} class="grow" type="password" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>Passwords should be at least 12 characters long. Write this down!</p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button class="btn btn-primary" type="submit">
      Download my key
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
