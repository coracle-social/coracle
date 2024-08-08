<script lang="ts">
  import InputProfilePicture from '@lib/components/InputProfilePicture.svelte'
  import Field from '@lib/components/Field.svelte'
  import Icon from '@lib/components/Icon.svelte'
  import InfoNip29 from '@app/components/InfoNip29.svelte'
  import {pushModal} from '@app/modal'

  const back = () => history.back()

  const next = () => pushModal()

  const showNip29Info = () => pushModal(InfoNip29)

  let file: File
  let name = ""
  let relay = ""
</script>

<div class="column gap-4">
  <h1 class="heading">Customize your Space</h1>
  <p class="text-center">
    Give people a few details to go on. You can always change this later.
  </p>
  <div class="flex justify-center py-2">
    <InputProfilePicture bind:file />
  </div>
  <Field>
    <p slot="label">Space Name</p>
    <label class="input input-bordered w-full flex items-center gap-2" slot="input">
      <Icon icon="fire-minimalistic" />
      <input bind:value={name} class="grow" type="text" />
    </label>
  </Field>
  <Field>
    <p slot="label">Relay</p>
    <label class="input input-bordered w-full flex items-center gap-2" slot="input">
      <Icon icon="remote-controller-minimalistic" />
      <input bind:value={relay} class="grow" type="text" />
    </label>
    <p slot="info">
      This should be a NIP-29 compatible nostr relay where you'd like to host your space.
      <button class="text-primary underline cursor-pointer" on:click={showNip29Info}>
        More information
      </button>
    </p>
  </Field>
  <div class="flex flex-row justify-between items-center gap-4">
    <button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </button>
    <button class="btn btn-primary" on:click={next}>
      Next
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </button>
  </div>
</div>
