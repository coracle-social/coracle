<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {goto} from '$app/navigation'
  import {hexToBytes} from '@noble/hashes/utils'
  import {getPubkey, makeSecret} from "@welshman/signer"
  import {addSession} from "@welshman/app"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoKeys from "@app/components/InfoKeys.svelte"
  import {loadUserData} from "@app/commands"
  import {pushModal, clearModals} from "@app/modal"
  import {clip} from "@app/toast"

  const secret = makeSecret()
  const nsec = nip19.nsecEncode(hexToBytes(secret))

  const back = () => history.back()

  const copyNsec = () => clip(nsec)

  const onSubmit = async () => {
    const pubkey = getPubkey(secret)

    addSession({method: "nip01", pubkey, secret})
    clearModals()
    goto("/settings/profile")
  }
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Sign Up</div>
    <div slot="info">With a freshly generated private key</div>
  </ModalHeader>
  <Field>
    <p slot="label">Private Key</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="key" />
      <input value={nsec} class="grow" type="password" />
      <Button on:click={copyNsec}>
        <Icon icon="copy" />
      </Button>
    </label>
    <p slot="info">
      Make sure to save your private key somewhere safe, like in a password manager.
      <Button class="link" on:click={() => pushModal(InfoKeys)}>What is a private key?</Button>
    </p>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">
      Next
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </Button>
  </ModalFooter>
</form>
