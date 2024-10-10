<script lang="ts">
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoRelay from "@app/components/InfoRelay.svelte"
  import SpaceCreateFinish from "@app/components/SpaceCreateFinish.svelte"
  import {pushModal} from "@app/modal"

  const back = () => history.back()

  const next = () => pushModal(SpaceCreateFinish)

  let file: File
  let name = ""
  let relay = ""
</script>

<form class="column gap-4" on:submit|preventDefault={next}>
  <ModalHeader>
    <div slot="title">Customize your Space</div>
    <div slot="info">Give people a few details to go on. You can always change this later.</div>
  </ModalHeader>
  <div class="flex justify-center py-2">
    <InputProfilePicture bind:file />
  </div>
  <Field>
    <p slot="label">Space Name</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="fire-minimalistic" />
      <input bind:value={name} class="grow" type="text" />
    </label>
  </Field>
  <Field>
    <p slot="label">Relay</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="remote-controller-minimalistic" />
      <input bind:value={relay} class="grow" type="text" />
    </label>
    <p slot="info">
      This can be any nostr relay where you'd like to host your space.
      <Button class="link" on:click={() => pushModal(InfoRelay)}>What is a relay?</Button>
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
