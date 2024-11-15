<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {
    createEvent,
    makeProfile,
    editProfile,
    createProfile,
    isPublishedProfile,
  } from "@welshman/util"
  import {pubkey, profilesByPubkey, publishThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import InfoHandle from "@app/components/InfoHandle.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {pushToast} from "@app/toast"

  const values = {...($profilesByPubkey.get($pubkey!) || makeProfile())}

  const back = () => history.back()

  const saveEdit = () => {
    const relays = ctx.app.router.FromUser().getUrls()
    const template = isPublishedProfile(values) ? editProfile(values) : createProfile(values)
    const event = createEvent(template.kind, template)

    publishThunk({event, relays})
    pushToast({message: "Your profile has been updated!"})
    clearModals()
  }

  let file: File
</script>

<form class="col-4" on:submit|preventDefault={saveEdit}>
  <div class="flex justify-center py-2">
    <InputProfilePicture bind:file bind:url={values.picture} />
  </div>
  <Field>
    <p slot="label">Username</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="user-circle" />
      <input bind:value={values.name} class="grow" type="text" />
    </label>
  </Field>
  <Field>
    <p slot="label">About You</p>
    <textarea
      class="textarea textarea-bordered leading-4"
      rows="3"
      bind:value={values.about}
      slot="input" />
  </Field>
  <Field>
    <p slot="label">Nostr Address</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="map-point" />
      <input bind:value={values.nip05} class="grow" type="text" />
    </label>
    <p slot="info">
      <Button class="link" on:click={() => pushModal(InfoHandle)}>What is a nostr address?</Button>
    </p>
  </Field>
  <div class="mt-4 flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-neutral" on:click={back}>Discard Changes</Button>
    <Button type="submit" class="btn btn-primary">Save Changes</Button>
  </div>
</form>
