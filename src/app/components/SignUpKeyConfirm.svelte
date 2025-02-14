<script lang="ts">
  import {preventDefault, copyToClipboard} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import SignUpProfile from "@app/components/SignUpProfile.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"

  type Props = {
    secret: string
    pubkey: string
    ncryptsec: string
  }

  const {secret, pubkey, ncryptsec}: Props = $props()

  const back = () => history.back()

  const copy = () => {
    copyToClipboard(ncryptsec)
    pushToast({message: "Your secret key has been copied to your clipboard!"})
  }

  const next = () => {
    pushModal(SignUpProfile, {secret, pubkey})
  }
</script>

<form class="column gap-4" onsubmit={preventDefault(next)}>
  <ModalHeader>
    {#snippet title()}
      <div>Download your key</div>
    {/snippet}
  </ModalHeader>
  <p>
    Great! We've encrypted your secret key and saved it to your device. If that didn't work, or if
    you'd rather save your key somewhere else, you can find the encrypted version below:
  </p>
  <Field>
    {#snippet label()}
      Encrypted Secret Key
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="key" />
        <input value={ncryptsec} class="ellipsize grow" />
        <Button onclick={copy} class="flex items-center">
          <Icon icon="copy" />
        </Button>
      </label>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button class="btn btn-primary" type="submit">
      Fill out your profile
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
