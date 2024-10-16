<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {getPubkey} from "@welshman/signer"
  import {addSession} from "@welshman/app"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoNostr from "@app/components/InfoNostr.svelte"
  import {loadUserData} from "@app/commands"
  import {pushModal, clearModals} from "@app/modal"
  import {pushToast} from "@app/toast"

  const back = () => history.back()

  const onSubmit = async () => {
    let secret = key

    if (secret.startsWith('nsec')) {
      secret = nip19.decode(secret).data as string
    }

    if (!isKeyValid(secret)) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that's an invalid private key.",
      })
    }

    const pubkey = getPubkey(secret)

    addSession({method: "nip01", pubkey, secret})

    loading = true

    await loadUserData(pubkey)

    clearModals()
  }

  const isKeyValid = (key: string) => {
    // Validate the key before setting it to state by encoding it using bech32.
    // This will error if invalid (this works whether it's a public or a private key)
    try {
      getPubkey(key)
    } catch (e) {
      return false
    }

    return true
  }

  let key = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Log In</div>
    <div slot="info">Already have a nostr key?</div>
  </ModalHeader>
  <Field>
    <p slot="label">Private Key*</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="key" />
      <input bind:value={key} class="grow" type="password" />
    </label>
    <p slot="info">
      A nostr nsec or private key. Note that this log in method is not recommended.
      <Button class="link" on:click={() => pushModal(InfoNostr)}>What is nostr?</Button>
    </p>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Next</Spinner>
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </Button>
  </ModalFooter>
</form>
